// Server-side specific overrides of model definitions in `shared/models.js`.
// Defines `sync()` for Tileset and TilesetList, replacing the default REST interface
// with loaders.
var _ = require('underscore'),
    Step = require('step'),
    settings = require('settings'),
    path = require('path'),
    MBTiles = require('tilelive').MBTiles,
    fs = require('fs'),
    SphericalMercator = require('tilelive').SphericalMercator,
    models = require('models'),
    Pool = require('tilelive').Pool;

models.Tileset.prototype.sync =
models.TilesetList.prototype.sync = function(method, model, success, error) {
    switch (method) {
    case 'read':
        if (model.id) {
            loadTileset(model, function(err, model) {
                return err ? error(err) : success(model);
            });
        }
        else {
            loadTilesets(model, function(err, model) {
                return err ? error(err) : success(model);
            });
        }
        break;
    }
};

// Load a tileset model. Retrieve `.mbtiles` file stats, open the DB, retrieve
// metadata about the tiles.
function loadTileset(model, callback) {
    var filepath = path.join(settings.tiles, model.id + '.mbtiles');
    var data = {};
    Step(
        function() {
            try {
                fs.stat(filepath, this);
            } catch(err) {
                this(err);
            }
        },
        function(err, stat) {
            if (err) return this(new Error('Tileset not found.'));
            data.size = stat.size;
            data.mtime = +stat.mtime;
            Pool.acquire('mbtiles', filepath, {}, this);
        },
        function(err, mbtiles) {
            var that = this;
            mbtiles.info(function(err, info) {
                Pool.release('mbtiles', filepath, mbtiles);
                that(err, info);
            });
        },
        function(err, info) {
            if (err) {
                callback(err);
            } else {
                callback(null, _.extend(data, info));
            }
        }
    );
}

// Load all tileset models.
function loadTilesets(model, callback) {
    Step(
        function() {
            try {
                fs.readdir(settings.tiles, this);
            } catch(err) {
                this(err);
            }
        },
        function(err, files) {
            if (err) {
                return this(new Error('Error reading tiles directory.'));
            } else if (files.length === 0) {
                return this(null, []);
            }
            var group = this.group();
            var tilesets = _.map(_.filter( files,
                function(filename) {
                    return path.extname(filename) === '.mbtiles';
                }),
                function(filename) {
                    return path.basename(filename, '.mbtiles');
                });
            for (var i = 0; i < tilesets.length; i++) {
                loadTileset({ id: tilesets[i] }, group());
            }
        },
        function(err, models) {
            // Ignore errors from loading individual models (e.g.
            // don't let one bad apple spoil the collection).
            models = _.select(models, function(model) {
                return (typeof model === 'object');
            });
            callback(null, models);
        }
    );
}

// Extend `MBTiles` class with an `info` method for retrieving metadata and
// performing fallback queries if certain keys (like `bounds`, `minzoom`,
// `maxzoom`) have not been provided.
MBTiles.prototype.info = function(callback) {
    var that = this;
    var info = {};
    info.basename = path.basename(that.filename);
    info.id = info.basename.replace(path.extname(that.filename), '');
    Step(
        // Load metadata table
        function() {
            var end = this;
            that.db.prepare(
                'SELECT * FROM metadata;',
                function(err, statement) {
                    if (err || !statement) end(err);
                    var next = function(err, row) {
                        if (err || !row) {
                            statement.finalize(function() {
                                end(err, info);
                            });
                        } else {
                            info[row.name] = row.value;
                            statement.step(next);
                        }
                    }
                    statement.step(next);
                }
            );
        },
        // Determine min/max zoom if needed
        function(err) {
            if (typeof info.maxzoom !== 'undefined'
                && typeof info.minzoom !== 'undefined') return this(null);

            var group = this.group();
            var zoomquery = function(zoom, callback) {
                that.db.prepare(
                    'SELECT zoom_level '
                    + 'FROM tiles '
                    + 'WHERE zoom_level = ? '
                    + 'LIMIT 1;',
                    function(err, statement) {
                        if (err || !statement) return callback(err);
                        statement.bind(1, zoom, function() {
                            statement.step(function(err, row) {
                                statement.finalize(function() {
                                    callback(err, row);
                                });
                            });
                        });
                    }
                );
            };
            for (var i = 0; i < 30; i++) {
                zoomquery(i, group());
            }
        },
        function(err, rows) {
            if (!err && rows) {
                var zooms = _.filter(rows, function(row) { return row; }),
                zooms = _.pluck(zooms, 'zoom_level');
                info.minzoom = zooms.shift();
                info.maxzoom = zooms.length ? zooms.pop() : info.minzoom;
            }
            this();
        },
        // Determine bounds if needed
        function(err) {
            if (info.bounds) return this();
            if (typeof info.minzoom === 'undefined') return this();

            var next = this;
            Step(
                function() {
                    var callback = this;
                    that.db.prepare(
                        'SELECT '
                        + 'MAX(tile_column) AS maxx, '
                        + 'MIN(tile_column) AS minx, '
                        + 'MAX(tile_row) AS maxy, '
                        + 'MIN(tile_row) AS miny '
                        + 'FROM tiles '
                        + 'WHERE zoom_level = ?;',
                        function(err, statement) {
                            if (err || !statement) return callback(err);
                            statement.bind(1, info.minzoom, function() {
                                statement.step(function(err, row) {
                                    statement.finalize(function() {
                                        callback(err, row);
                                    });
                                });
                            });
                        }
                    );
                },
                function(err, row) {
                    if (!err && row) {
                        // @TODO this breaks a little at zoom level zero
                        var mercator = new SphericalMercator({});
                        var urTile = mercator.xyz_to_bbox(row.maxx,
                            row.maxy, info.minzoom, true);
                        var llTile = mercator.xyz_to_bbox(row.minx,
                            row.miny, info.minzoom, true);
                        info.bounds = [llTile[0], llTile[1],
                            urTile[2], urTile[3]].join(',');
                    }
                    next();
                }
            );
        },
        // Return info
        function() {
            info.minzoom = parseInt(info.minzoom);
            info.maxzoom = parseInt(info.maxzoom);
            info.bounds = _.map(info.bounds.split(','), function(val) { return parseFloat(val) });
            info.center = {
                lat: (info.bounds[3] - info.bounds[1]) / 2 + info.bounds[1],
                lon: (info.bounds[2] - info.bounds[0]) / 2 + info.bounds[0]
            }
            callback(null, info);
        }
    );
};

module.exports = models;

// Loaders for individual and all tilesets.
var _ = require('underscore')._,
    fs = require('fs'),
    path = require('path'),
    Step = require('step'),
    MBTiles = require('tilelive').MBTiles,
    Pool = require('tilelive').Pool,
    SphericalMercator = require('tilelive').SphericalMercator,
    tilesets = {};

module.exports = function(settings) {
    // Extend `MBTiles` class with an `info` method for retrieving metadata and
    // performing fallback queries if certain keys (like `bounds`, `minzoom`,
    // `maxzoom`) have not been provided.
    MBTiles.prototype.info = function(callback) {
        var that = this;
        var info = {};
        info.basename = path.basename(that.filename);
        info.id = info.basename.replace(path.extname(that.filename), '');
        Step(
            // Check db integrity. Commented out for now -- if lower TTL does
            // not prevent serving/caching of incomplete tilesets in proxy
            // cache scenarios, consider putting this back in. Note that even
            // `PRAGMA quick_check` can be a very expensive operation on large
            // databases.
            // function() {
            //     var end = this;
            //     that.db.get('PRAGMA quick_check(1)', function(err, row) {
            //         if (!(row && row.integrity_check && row.integrity_check === 'ok')) {
            //             end(new Error('Corrupted database.'));
            //         } else {
            //             end(null);
            //         }
            //     });
            // },
            // Load metadata table
            function(err) {
                if (err) return callback(err);
                var end = this;
                that.db.all("SELECT name, value FROM metadata", function(err, rows) {
                    if (rows) for (var i = 0; i < rows.length; i++) {
                        info[rows[i].name] = rows[i].value;
                    }
                    end(err);
                });
            },
            // Determine min/max zoom if needed
            function(err) {
                if (err) return callback(err);
                if (typeof info.maxzoom !== 'undefined'
                    && typeof info.minzoom !== 'undefined') return this(null);

                var group = this.group();

                var zoomquery = that.db.prepare('SELECT zoom_level FROM tiles ' +
                                                'WHERE zoom_level = ? LIMIT 1');
                for (var i = 0; i < 30; i++) {
                    zoomquery.get(i, group());
                }
                zoomquery.finalize();
            },
            function(err, rows) {
                if (err) throw err;
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
                if (err) return callback(err);
                if (info.bounds) return this();
                if (typeof info.minzoom === 'undefined') return this();

                var next = this;
                Step(
                    function() {
                        that.db.get(
                            'SELECT MAX(tile_column) AS maxx, ' +
                            'MIN(tile_column) AS minx, MAX(tile_row) AS maxy, ' +
                            'MIN(tile_row) AS miny FROM tiles ' +
                            'WHERE zoom_level = ?',
                            info.minzoom,
                            this
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
                            // @TODO bounds are limited to "sensible" values here
                            // as sometimes tilesets are rendered with "negative"
                            // and/or other extremity tiles. Revisit this if there
                            // are actual use cases for out-of-bounds bounds.
                            info.bounds = [
                                llTile[0] > -180 ? llTile[0] : -180,
                                llTile[1] > -90 ? llTile[1] : -90,
                                urTile[2] < 180 ? urTile[2] : 180,
                                urTile[3] < 90 ? urTile[3] : 90
                            ].join(',');
                        }
                        next();
                    }
                );
            },
            // Return info
            function(err) {
                if (err) return callback(err);
                var range = parseInt(info.maxzoom) - parseInt(info.minzoom);
                info.minzoom = parseInt(info.minzoom);
                info.maxzoom = parseInt(info.maxzoom);
                info.bounds = _.map(info.bounds.split(','), function(val) { return parseFloat(val) });
                info.center = [
                    (info.bounds[2] - info.bounds[0]) / 2 + info.bounds[0],
                    (info.bounds[3] - info.bounds[1]) / 2 + info.bounds[1],
                    (range <= 1) ? info.maxzoom : Math.floor(range * 0.5) + info.minzoom
                ];
                callback(null, info);
            }
        );
    };

    // Load a tileset model. Retrieve `.mbtiles` file stats, open the DB, retrieve
    // metadata about the tiles.
    var load = function (model, callback) {
        var filepath = path.join(settings.tiles, model.id + '.mbtiles');
        var data = {};
        Step(
            function() {
                fs.stat(filepath, this);
            },
            function(err, stat) {
                if (err) return callback(new Error.HTTP('Tileset not found.', 404));

                data.size = stat.size;
                data.mtime = +stat.mtime;
                data.status = false;
                if (tilesets[model.id] && tilesets[model.id].mtime === data.mtime) {
                    if (tilesets[model.id].status) {
                        return callback(null, tilesets[model.id]);
                    } else {
                        return callback(new Error.HTTP('Tileset not found.', 404));
                    }
                } else {
                    tilesets[model.id] = data;
                    Pool.acquire('mbtiles', filepath, {}, this);
                }
            },
            function(err, mbtiles) {
                if (err) return callback(err);

                var that = this;
                mbtiles.info(function(err, info) {
                    Pool.release('mbtiles', filepath, mbtiles);
                    that(err, info);
                });
            },
            function(err, info) {
                if (err) return callback(err);

                _.extend(data, info, {status: true});
                callback(null, data);
            }
        );
    };

    // Load all tileset models.
    var all = function (model, callback) {
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
                var tilesets = _(files).chain()
                    .filter(function(filename) {
                        return path.extname(filename) === '.mbtiles';
                    })
                    .map(function(filename) {
                        return path.basename(filename, '.mbtiles');
                    })
                    .value();
                if (tilesets.length) {
                    for (var i = 0; i < tilesets.length; i++) {
                        load({ id: tilesets[i] }, group());
                    }
                } else {
                    this(null, []);
                }
            },
            function(err, models) {
                // Ignore errors from loading individual models (e.g.
                // don't let one bad apple spoil the collection).
                models = _(models).chain()
                    .select(function(model) {
                        return (typeof model === 'object');
                    })
                    .sortBy(function(model) {
                        return (model.name || model.id).toLowerCase();
                    })
                    .value();
                callback(null, models);
            }
        );
    };

    return { load: load, all: all };
};

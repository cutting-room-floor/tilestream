// Loaders for individual and all tilesets.
var _ = require('underscore'),
    fs = require('fs'),
    path = require('path'),
    Step = require('step'),
    MBTiles = require('mbtiles').MBTiles,
    tilelive = new (require('tilelive').Server)(require('mbtiles')),
    sm = new (require('tilelive').SphericalMercator),
    tilesets = {};

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
        function() {
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
            if (err) throw err;
            if (info.maxzoom !== undefined
                && info.minzoom !== undefined) return this();

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
            if (rows) {
                var zooms = _(rows).chain()
                    .reject(_.isUndefined)
                    .pluck('zoom_level')
                    .value();
                info.minzoom = zooms.shift();
                info.maxzoom = zooms.length ? zooms.pop() : info.minzoom;
            }
            this();
        },
        // Determine bounds if needed
        function(err) {
            if (err) throw err;
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
                        var urTile = sm.bbox(row.maxx, row.maxy, info.minzoom, true);
                        var llTile = sm.bbox(row.minx, row.miny, info.minzoom, true);
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
            info.bounds = _(info.bounds.split(',')).map(parseFloat);
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
var load = function (filepath, callback) {
    // Restrict tileset IDs to alphanumeric characters,
    // underscores and dashes.
    if (!path.basename(filepath, '.mbtiles').match(/^[\w-]+$/)) {
        return callback(new Error.HTTP('Tileset not found.', 404));
    }

    var data = {};
    Step(
        function() {
            fs.stat(filepath, this);
        },
        function(err, stat) {
            if (err) return callback(new Error.HTTP('Tileset not found.', 404));

            data.headers = {
                'Last-Modified': stat.mtime,
                'E-Tag': stat.size + '-' + Number(stat.mtime)
            };
            data.size = stat.size;
            data.mtime = +stat.mtime;
            data.status = false;
            if (tilesets[filepath] && tilesets[filepath].mtime === data.mtime) {
                if (tilesets[filepath].status) {
                    return callback(null, tilesets[filepath]);
                } else {
                    return callback(new Error.HTTP('Tileset not found.', 404));
                }
            } else {
                tilesets[filepath] = data;
                tilelive.acquire(filepath, this);
            }
        },
        function(err, mbtiles) {
            if (err) return callback(err);

            var that = this;
            mbtiles.info(function(err, info) {
                tilelive.release(filepath, mbtiles);
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
var all = function (filepath, callback) {
    Step(
        function() {
            try {
                fs.readdir(filepath, this);
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
                    load(path.join(filepath, tilesets[i] + '.mbtiles'), group());
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

module.exports = {
    load: load,
    all: all
};


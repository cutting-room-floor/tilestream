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
    Step(function() {
        var end = this;
        that.db.all('SELECT name, value FROM metadata', function(err, rows) {
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
    });
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
    Step(function() {
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
        if (tilesets[filepath] && tilesets[filepath].mtime === data.mtime) {
            return callback(null, tilesets[filepath]);
        } else {
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

        _(data).extend(info);
        tilesets[filepath] = data;
        callback(null, data);
    });
};

// List all tileset models.
var list = function (filepath, callback) {
    fs.readdir(filepath, function(err, files) {
        if (err) return callback(err);
        callback(null, _(files).chain()
            .filter(function(f) { return f.match(/^[\w-]+\.mbtiles$/); })
            .map(function(f) { return path.basename(f, '.mbtiles'); })
            .value());
    });
};

// Load all tileset models.
var all = function (filepath, callback) {
    Step(function() {
        list(filepath, this);
    },
    function(err, tilesets) {
        if (err) return callback(err);
        var group = this.group();
        for (var i = 0; i < tilesets.length; i++) {
            load(path.join(filepath, tilesets[i] + '.mbtiles'), group());
        }
    },
    // Ignore errors from loading individual models (e.g.
    // don't let one bad apple spoil the collection).
    function(err, models) {
        callback(null, _(models).chain()
            .select(function(m) { return (typeof m === 'object'); })
            .sortBy(function(m) { return (m.name || m.id).toLowerCase(); })
            .value());
    });
};

module.exports = {
    load: load,
    all: all,
    list: list
};


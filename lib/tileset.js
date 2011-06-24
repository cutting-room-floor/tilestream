// Loaders for individual and all tilesets.
var _ = require('underscore'),
    fs = require('fs'),
    path = require('path'),
    Step = require('step'),
    MBTiles = require('mbtiles').MBTiles,
    tilelive = new (require('tilelive').Server)(require('mbtiles')),
    tilesets = {};

var validTilesourceFilename = /^[\w-]+\.(mbtiles|tilejson)$/;

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
// Ignore errors from loading individual models (e.g.
// don't let one bad apple spoil the collection).
var all = function (filepath, callback) {
    Step(function() {
        list(filepath, this);
    },
    function(err, tilesets) {
        if (err || !tilesets) return this(null, []);
        var group = this.group();
        for (var i = 0; i < tilesets.length; i++) {
            load(path.join(filepath, tilesets[i] + '.mbtiles'), group());
        }
    },
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


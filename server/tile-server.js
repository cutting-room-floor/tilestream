// Routes for the tile server. Suitable for HTTP cacheable content with a
// long TTL.
var _ = require('underscore'),
    Step = require('step'),
    fs = require('fs'),
    path = require('path'),
    compress = require('compress'),
    Tile = require('tilelive').Tile,
    errorTile;

function inflate(buffer, callback) {
    var gz = new compress.Gunzip();
    var data = '';
    gz.write(buffer, function(err, chunk) {
        if (err) {
            callback(err);
            callback = undefined;
        }
        else data += chunk;
    });
    gz.close(function(err, chunk) {
        if (err) {
            if (callback) callback(err);
        }
        else data = callback(null, data + chunk);
    });
}

module.exports = function(app, settings) {
    // Load errorTile into memory at require time. Blocking.
    if (!errorTile) {
        errorTile = fs.readFileSync(path.join(__dirname,
            '..',
            'client',
            'images',
            'errortile.png'));
    }

    // Route middleware. Validates an mbtiles file specified in a tile or
    // download route.
    var validateTileset = function(req, res, next) {
        res.mapfile = path.join(settings.tiles, req.params[0] + '.mbtiles');
        path.exists(res.mapfile, function(exists) {
            if (exists) {
                return next();
            } else {
                return next(new Error('Tileset not found.'));
            }
        });
    };

    // If "download" feature is enabled, add route equivalent to
    // `/download/:tileset` except with handling for `:tileset` parameters that may
    // contain a `.` character.
    if (settings.features && settings.features.download) {
        var download = /^\/download\/([\w+|\d+|.|-]*)?.mbtiles/;
        app.get(download, validateTileset, function(req, res, next) {
            res.sendfile(res.mapfile, function(err, path) {
                return err && next(err);
            });
        });
    }

    // Route equivalent to `/1.0.0/:tileset/:z/:x/:y.:format` except with handling
    // for `:tileset` parameters that may contain a `.` character.
    var tile = /^\/1.0.0\/([\w+|\d+|.|-]*)?\/([-]?\d+)\/([-]?\d+)\/([-]?\d+).(png|jpg|jpeg)/;
    app.get(tile, validateTileset, function(req, res, next) {
        var tile = new Tile({
            type: 'mbtiles',
            datasource: res.mapfile,
            format: req.params[4],
            xyz: [req.params[2], req.params[3], req.params[1]]
        });
        tile.render(function(err, data) {
            if (!err) {
                data[1] = _.extend({}, settings.header_defaults, data[1]);
                res.send(data[0], data[1]);
            } else {
                res.send(errorTile, {
                    'Content-Type':'image/png',
                    'Cache-Control': 'max-age=' +
                        60 // minute
                        * 60 // hour
                }, 404);
            }
        });
    });

    // Load a tileset formatter or legend
    var formatter = /^\/1.0.0\/([\w+|\d+|.|-]*)?\/(formatter.json|legend.json)/;
    app.get(formatter, validateTileset, function(req, res, next) {
        var tile = new Tile({
            type: 'mbtiles',
            datasource: res.mapfile,
            format: req.params[1],
        });
        tile.render(function(err, data) {
            if (err) {
                res.send(err.toString(), 500);
            } else if (!data) {
                res.send(req.params[1] + ' not found', 404);
            } else {
                var object = {};
                var key = req.params[1].split('.').shift();
                object[key] = data;
                res.send(object);
            }
        });
    });

    // A single route for serving tiles.
    var grid = /^\/1.0.0\/([\w+|\d+|.|-]*)?\/([-]?\d+)\/([-]?\d+)\/([-]?\d+).grid.json/;
    app.get(grid, validateTileset, function(req, res, next) {
        req.query.callback = req.query.callback || 'grid';
        var tile = new Tile({
            type: 'mbtiles',
            datasource: res.mapfile,
            format: 'grid.json',
            xyz: [req.params[2], req.params[3], req.params[1]]
        });
        tile.render(function(err, data) {
            if (err) {
                res.send(err.toString(), 500);
            } else if (!data) {
                res.send('Grid not found', 404);
            } else {
                res.send(
                    req.query.callback + '(' + data + ');',
                    {'Content-Type': 'text/javascript; charset=utf-8'}
                );
            }
        });
    });
};

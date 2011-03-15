// Routes for the tile server. Suitable for HTTP cacheable content with a
// long TTL.
var _ = require('underscore'),
    Step = require('step'),
    fs = require('fs'),
    path = require('path'),
    compress = require('compress'),
    Tile = require('tilelive').Tile;

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
    // Route middleware. Validates an mbtiles file specified in a tile or
    // download route.
    var validateTileset = function(req, res, next) {
        res.mapfile = path.join(settings.tiles, req.params[0] + '.mbtiles');
        path.exists(res.mapfile, function(exists) {
            if (exists) {
                return next();
            } else {
                res.send('Tileset not found.', {
                    'Content-Type':'image/png',
                }, 404);
            }
        });
    };

    // Load HTTP headers specific to the requested mbtiles file.
    var loadMapFileHeaders = function(req, res, next) {
        var headers = {};
        if (res.mapfile) {
            fs.stat(res.mapfile, function(err, stat) {
                if (!err) {
                    res.mapfile_headers = {
                        'Last-Modified': stat.mtime,
                        'E-Tag': stat.size + '-' + Number(stat.mtime)
                    }
                    return next();
                }
            });
        }
    }

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
    app.get(tile, validateTileset, loadMapFileHeaders, function(req, res, next) {
        var tile = new Tile({
            type: 'mbtiles',
            datasource: res.mapfile,
            format: req.params[4],
            xyz: [req.params[2], req.params[3], req.params[1]]
        });
        tile.render(function(err, data) {
            if (!err) {
                res.send(data[0], _.extend({},
                    res.mapfile_headers,
                    settings.header_defaults,
                    data[1]));
            } else if (err.toString() === 'Tile does not exist') {
                res.send('Tile not found.', {
                    'Content-Type':'image/png',
                }, 404);
            }
            else {
                res.send(err.toString(), 500);
            }
        });
    });

    // Load a tileset layer.json manifest.
    var formatter = /^\/1.0.0\/([\w+|\d+|.|-]*)?\/layer.json/;
    app.get(formatter, validateTileset, loadMapFileHeaders, function(req, res, next) {
        req.query.callback = req.query.callback || 'grid';
        var tile = new Tile({
            type: 'mbtiles',
            datasource: res.mapfile,
            format: 'layer.json',
        });
        tile.render(function(err, data) {
            if (!err) {
                res.send(data, _.extend(
                    { 'Content-Type': 'text/javascript' },
                    res.mapfile_headers,
                    settings.header_defaults
                ));
            } else if ((err.toString() === 'Key does not exist') || !data) {
                res.send('layer.json not found', 404);
            } else {
                res.send(err.toString(), 500);
            }
        });
    });

    // Load an interaction grid tile.
    var grid = /^\/1.0.0\/([\w+|\d+|.|-]*)?\/([-]?\d+)\/([-]?\d+)\/([-]?\d+).grid.json/;
    app.get(grid, validateTileset, loadMapFileHeaders, function(req, res, next) {
        req.query.callback = req.query.callback || 'grid';
        var tile = new Tile({
            type: 'mbtiles',
            datasource: res.mapfile,
            format: 'grid.json',
            xyz: [req.params[2], req.params[3], req.params[1]]
        });
        tile.render(function(err, data) {
            if (!err) {
                res.send(
                    req.query.callback + '(' + data + ');',
                    _.extend(
                        {'Content-Type': 'text/javascript; charset=utf-8'},
                        res.mapfile_headers,
                        settings.header_defaults
                    )
                );
            }
            else if ((err.toString() === 'Grid does not exist') || !data) {
                res.send('Grid not found', 404);
            }
            else {
                res.send(err.toString(), 500);
            }
        });
    });

    // Basic route for the root. Useful for checking the health of the server.
    app.get('/', function(req, res, next) {
        res.send('TileStream', 200);
    });
};

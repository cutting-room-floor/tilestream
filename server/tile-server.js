// Routes for the tile server. Suitable for HTTP cacheable content with a
// long TTL.
var _ = require('underscore'),
    Step = require('step'),
    fs = require('fs'),
    path = require('path'),
    compress = require('compress'),
    MBTiles = require('tilelive').MBTiles,
    poolcache = require('poolcache')(5),
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

    // Route middleware. Validates an mbtiles map specified in a tile or
    // download route.
    var validateMap = function(req, res, next) {
        res.mapfile = path.join(settings.tiles, req.params[0] + '.mbtiles');
        path.exists(res.mapfile, function(exists) {
            if (exists) {
                return next();
            } else {
                return next(new Error('Map not found.'));
            }
        });
    };

    // Route middleware. Loads and acquires a connection to an mbtiles db.
    var loadMap = function(req, res, next) {
        poolcache.acquire(res.mapfile, {
            create: function(callback) {
                var mbtiles = new MBTiles(res.mapfile, {}, function(err) {
                    if (err) throw err;
                    callback(mbtiles);
                });
            },
            destroy: function(mbtiles) {
                mbtiles.db.close(function() {});
            }
        }, function(mbtiles) {
            res.mbtiles = mbtiles;
            next();
        });
    };

    // If "download" feature is enabled, add route equivalent to
    // `/download/:map` except with handling for `:map` parameters that may
    // contain a `.` character.
    if (settings.features && settings.features.download) {
        var download = /^\/download\/([\w+|\d+|.|-]*)?.mbtiles/;
        app.get(download, validateMap, function(req, res, next) {
            res.sendfile(res.mapfile, function(err, path) {
                return err && next(err);
            });
        });
    }

    // Route equivalent to `/1.0.0/:map/:z/:x/:y.:format` except with handling
    // for `:map` parameters that may contain a `.` character.
    var tile = /^\/1.0.0\/([\w+|\d+|.|-]*)?\/([-]?\d+)\/([-]?\d+)\/([-]?\d+).(png|jpg|jpeg)/;
    app.get(tile, validateMap, loadMap, function(req, res, next) {
        Step(
            function() {
                var that = this;
                res.mbtiles.tile(
                    req.params[2],
                    req.params[3],
                    req.params[1],
                    function(err, tile) {
                        that(err, tile);
                        poolcache.release(res.mapfile, res.mbtiles);
                    }
                );
            },
            function(err, tile) {
                var headers = _.extend(
                    settings.header_defaults,
                    { 'Content-Type': 'image/png' }
                );
                if (!err && tile) {
                    res.send(tile, headers);
                } else {
                    res.send(errorTile, headers);
                }
            }
        );
    });

    // Load a map formatter
    var formatter = /^\/1.0.0\/([\w+|\d+|.|-]*)?\/formatter.json/;
    app.get(formatter, validateMap, loadMap, function(req, res, next) {
        Step(
            function() {
                var that = this;
                res.mbtiles.formatter(function(err, formatter) {
                    that(err, formatter);
                    poolcache.release(res.mapfile, res.mbtiles);
                });
            },
            function(err, formatter) {
                if (err) {
                    res.send(err.toString(), 500);
                } else if (!tile) {
                    res.send('Formatter not found', 400);
                } else {
                    res.send({ 'formatter': formatter });
                }
            }
        );
    });

    // A single route for serving tiles.
    var grid = /^\/1.0.0\/([\w+|\d+|.|-]*)?\/([-]?\d+)\/([-]?\d+)\/([-]?\d+).grid.json/;
    app.get(grid, validateMap, loadMap, function(req, res, next) {
        Step(
            function() {
                res.mbtiles.grid(
                    req.params[2],
                    req.params[3],
                    req.params[1],
                    this
                );
            },
            function(err, grid) {
                var that = this;
                res.mbtiles.grid_data(
                    req.params[2],
                    req.params[3],
                    req.params[1],
                    function(err, grid_data) {
                        poolcache.release(res.mapfile, res.mbtiles);
                        that(err, grid, grid_data);
                    }
                );
            },
            function(err, grid_compressed, grid_data) {
                if (err) {
                    res.send(err.toString(), 500);
                } else if (!grid_compressed) {
                    res.send('Grid not found', 404);
                } else {
                    // Data coming out of MBTiles is gzipped;
                    // we need to inflate it to deal with it.
                    inflate(new Buffer(grid_compressed, 'binary'), function(err, grid) {
                        res.writeHead(200,
                            _.extend(settings.header_defaults, {
                                'Content-Type': 'text/javascript'
                            }));

                        // Manually wrap the JSON in JSONp in order to
                        // avoid re-encoding the UTF-8 in griddata
                        if (req.query.callback) {
                            res.write(req.query.callback + '({"grid":');
                        }
                        res.write(grid);
                        res.write(',"grid_data":');
                        res.write(JSON.stringify(grid_data));
                        if (req.query.callback) {
                            res.write('});');
                        }
                        res.end();
                    });
                }
            }
        );
    });
};

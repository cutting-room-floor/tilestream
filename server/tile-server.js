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
    app.get(tile, validateMap, function(req, res, next) {
        var tile = new Tile({
            type: 'mbtiles',
            mapfile: res.mapfile,
            format: req.params[4],
            xyz: [req.params[2], req.params[3], req.params[1]]
        });
        tile.render(function(err, data) {
            if (!err) {
                data[1] = _.extend(settings.header_defaults, data[1]);
                res.send(data[0], data[1]);
            } else {
                headers = _.extend(settings.header_defaults, {'Content-Type':'image/png'});
                res.send(errorTile, headers);
            }
        });
    });

    // Load a map formatter or legend
    var formatter = /^\/1.0.0\/([\w+|\d+|.|-]*)?\/(formatter.json|legend.json)/;
    app.get(formatter, validateMap, function(req, res, next) {
        var tile = new Tile({
            type: 'mbtiles',
            mapfile: res.mapfile,
            format: req.params[1],
        });
        tile.render(function(err, data) {
            if (err) {
                res.send(err.toString(), 500);
            } else if (!data) {
                res.send(req.params[1] + ' not found', 400);
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
    app.get(grid, validateMap, function(req, res, next) {
        var tile = new Tile({
            type: 'mbtiles',
            mapfile: res.mapfile,
            format: 'grid.json',
            xyz: [req.params[2], req.params[3], req.params[1]]
        });
        Step(
            function() {
                tile.render(this);
            },
            function(err, grid) {
                if (err) {
                    res.send(err.toString(), 500);
                } else if (!grid[0]) {
                    res.send('Grid not found', 404);
                } else {
                    var grid_compressed = grid[0];
                    var grid_data = grid[1];
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

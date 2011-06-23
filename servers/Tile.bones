server = Bones.Server.extend({
    // Necessary to actually instantiate tile server.
    port:3001,

    initialize: function(app) {
        if (app.config.tilePort !== app.config.uiPort) {
            this.port = app.config.tilePort;
            this.enable('jsonp callback');
            this.use(new servers['Host'](app));
        } else {
            this.port = null;
        }

        this.config = app.config;
        this.config.header = { 'Cache-Control': 'max-age=' + 60 * 60 };
        this.initializeRoutes();
    },

    initializeRoutes: function() {
        var load = this.load.bind(this);

        // 1.0.0 endpoints: legacy, to be removed at 0.2.0
        this.get('/1.0.0/:tileset/:z/:x/:y.(png|jpg|jpeg|grid.json)', load, this.tile_1.bind(this));
        this.get('/1.0.0/:tileset/layer.json', load, this.tile_1.bind(this));

        // 2.0.0 endpoints
        this.get('/2.0.0/:tileset/:z/:x/:y.(png|jpg|jpeg|grid.json)', load, this.tile.bind(this));
        this.get('/2.0.0/:tileset/layer.json', load, this.tile.bind(this));

        this.get('/download/:tileset.mbtiles', load, this.download.bind(this));
        this.get('/status', this.status);
    },

    // Basic route for checking the health of the server.
    status: function(req, res, next) {
        res.send('TileStream', 200);
    },

    // Override start. We must call the callback regardless of whether the port
    // is set or not.
    start: function(callback) {
        if (this.port) {
            this.listen(this.port, callback);
        } else {
            callback();
        }
        return this;
    },

    // Route middleware. Validate and load an mbtiles file specified in a tile
    // or download route.
    load: function(req, res, next) {
        var model = new models.Tileset({ id: req.param('tileset') }, req.query);
        model.fetch({
            success: function(model) {
                res.model = model;
                res.mapfile = model.filepath(this.config.tiles);
                next();
            }.bind(this),
            error: function(model, err) {
                next(err);
            }.bind(this)
        });
    },

    // MBTiles download.
    // @TODO: Current `maxAge` option is hardcoded into place. Find better
    // way to pass this through.
    download: function(req, res, next) {
        res.sendfile(res.mapfile, { maxAge: 3600 }, function(err, path) {
            // @TODO: log the error if one occurs.
            // We don't call next() here as HTTP headers/response has
            // already commenced by this point.
        });
    },

    // Tile endpoint.
    tile: function(req, res, next) {
        var config = this.config;
        var options = {
            datasource: res.mapfile,
            format: req.params[0] ? req.params[0] : 'layer.json',
            x: req.param('x'),
            y: req.param('y'),
            z: req.param('z')
        };
        server.tilelive.serve(options, function(err, data) {
            if (!err) {
                // TODO: move to tilelive.js project
                if (req.params[0] === 'grid.json') {
                    data[0].keys = [data[0].keys];
                    data[0].data = [data[0].data];
                } else if (!req.params[0]) {
                    if (data[0].formatter) data[0].formatter = [data[0].formatter];
                    if (data[0].legend) data[0].legend = [data[0].legend];
                }

                var headers = _({}).extend(
                    res.model.get('headers'),
                    config.header,
                    data[1]
                );
                res.send(data[0], headers);
            } else {
                if (!(err instanceof Error)) err = new Error(err);
                err.status = 404;
                next(err);
            }
        });
    },

    // Tile endpoint.
    tile_1: function(req, res, next) {
        var config = this.config;
        var options = {
            datasource: res.mapfile,
            format: req.params[0] ? req.params[0] : 'layer.json',
            x: req.param('x'),
            y: req.param('y'),
            z: req.param('z')
        };
        server.tilelive.serve(options, function(err, data) {
            if (!err) {
                var headers = _({}).extend(
                    res.model.get('headers'),
                    config.header,
                    data[1]
                );
                res.send(data[0], headers);
            } else {
                if (!(err instanceof Error)) err = new Error(err);
                err.status = 404;
                next(err);
            }
        });
    }
});

// Routes for the tile server. Suitable for HTTP cacheable content with a
// long TTL.
server.tilelive = new (require('tilelive').Server)(require('mbtiles'));

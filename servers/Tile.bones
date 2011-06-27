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
        this.get('/1.0.0/:tileset/:z/:x/:y.(png|jpg|jpeg|grid.json)', load, this.tile.bind(this));
        this.get('/1.0.0/:tileset/layer.json', load, this.layer.bind(this));
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
        var headers = _({}).extend(res.model.get('headers'), this.config.header);
        res.model.source.getTile(req.param('z'), req.param('x'), req.param('y'),
            function(err, tile) {
                if (err) {
                    err = new Error(err);
                    err.status = 404;
                    next(err);
                } else {
                    res.send(tile, headers);
                }
            });
    },

    layer: function(req, res, next) {
        next(new Error('TODO: implement layer.json'));
    }
});

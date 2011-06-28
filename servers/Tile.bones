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
        _.bindAll(this, 'load', 'tile', 'grid', 'layer', 'download', 'status',
            'grid_1', 'layer_1');

        // 1.0.0 endpoints: legacy, to be removed at 0.2.0. Scheme is TMS.
        this.get('/1.0.0/:tileset/:z/:x/:y.(png|jpg|jpeg)', this.load, this.tile);
        this.get('/1.0.0/:tileset/:z/:x/:y.grid.json', this.load, this.grid_1);
        this.get('/1.0.0/:tileset/layer.json', this.load, this.layer_1);

        // 2.0.0 endpoints. Scheme is TMS.
        this.get('/2.0.0/:tileset/:z/:x/:y.(png|jpg|jpeg)', this.load, this.tile);
        this.get('/2.0.0/:tileset/:z/:x/:y.grid.json', this.load, this.grid);
        this.get('/2.0.0/:tileset/layer.json', this.load, this.layer);

        this.get('/download/:tileset.mbtiles', this.load, this.download);
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
        if (!(/^[\w-]+$/i).test(req.param('tileset'))) {
            return next(new Error.HTTP('Tileset not found', 404));
        }

        var model = new models.Tileset({ id: req.param('tileset') }, req.query);
        model.fetch({
            success: function(model) {
                res.model = model;
                next();
            },
            error: function(model, err) {
                next(err);
            }
        });
    },

    // MBTiles download.
    // @TODO: Current `maxAge` option is hardcoded into place. Find better
    // way to pass this through.
    download: function(req, res, next) {
        if (res.model.source.filename) {
            res.sendfile(res.model.source.filename, { maxAge: 3600 }, function(err, path) {
                // @TODO: log the error if one occurs.
                // We don't call next() here as HTTP headers/response has
                // already commenced by this point.
            });
        } else {
            next(new Error.HTTP("Tileset can't be downloaded", 404));
        }
    },

    // Grid endpoint for version 1.0.0.
    // Incoming coordinates are in TMS.
    grid_1: function(req, res, next) {
        var z = req.param('z'), x = req.param('x'), y = req.param('y');

        // Flip Y coordinate because the Tilesource interface is in XYZ.
        y = Math.pow(2, z) - 1 - y;

        var headers = _.clone(this.config.header);
        res.model.source.getGrid(z, x, y, function(err, grid, options) {
            if (err) {
                err.status = 404;
                next(err);
            } else {
                _.extend(headers, options || {});
                res.send(grid, headers);
            }
        });
    },

    // Layer endpoint for version 1.0.0.
    layer_1: function(req, res, next) {
        res.send(res.model);
    },

    // Tile endpoint for versions 1.0.0 and 2.0.0.
    // Incoming coordinates are in TMS.
    tile: function(req, res, next) {
        var z = req.param('z'), x = req.param('x'), y = req.param('y');

        // Flip Y coordinate because the Tilesource interface is in XYZ.
        y = Math.pow(2, z) - 1 - y;

        var headers = _.clone(this.config.header);
        res.model.source.getTile(z, x, y, function(err, tile, options) {
            if (err) {
                err.status = 404;
                next(err);
            } else {
                _.extend(headers, options || {});
                res.send(tile, headers);
            }
        });
    },

    // Grid endpoint for version 2.0.0.
    // Incoming coordinates are in TMS.
    grid: function(req, res, next) {
        next(new Error('TODO: implement grid.json'));
        // data[0].keys = [data[0].keys];
        // data[0].data = [data[0].data];
    },

    // Layer endpoint for version 2.0.0.
    layer: function(req, res, next) {
        var data = res.model.toJSON();
        if (data[0].formatter) data[0].formatter = [data[0].formatter];
        if (data[0].legend) data[0].legend = [data[0].legend];
        res.send(res.model);
    }
});

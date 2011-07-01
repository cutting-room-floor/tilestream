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
        _.bindAll(this, 'load', 'tile', 'grid', 'layer', 'download', 'status');

        this.param('tileset', this.load);

        // 1.0.0 endpoints. Scheme is TMS.
        this.get('/1.0.0/:tileset/:z/:x/:y.(png|jpg|jpeg)', this.tile);
        this.get('/1.0.0/:tileset/:z/:x/:y.grid.json', this.grid);
        this.get('/1.0.0/:tileset/layer.json', this.layer);

        this.get('/download/:tileset.mbtiles', this.download);
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

    validTilesetID: function(id) {
        return (/^[\w-]+$/i).test(id)
    },

    // Route middleware. Validate and load an mbtiles file specified in a tile
    // or download route.
    load: function(req, res, next, id) {
        if (arguments.length === 1) console.trace(arguments[0]);
        if (!this.validTilesetID(id)) {
            return next(new Error.HTTP('Tileset does not exist', 404));
        }

        var model = new models.Tileset({ id: id }, req.query);
        model.fetch({
            success: function(model) {
                res.model = model;
                next();
            },
            error: function(model, err) {
                err.status = 404;
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

    // Tile endpoint
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

    // Grid endpoint.
    // Incoming coordinates are in TMS.
    grid: function(req, res, next) {
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

    // Layer endpoint for version 2.0.0.
    layer: function(req, res, next) {
        var data = res.model.toJSON();

        // Make sure these are arrays.
        if (data.formatter) data.formatter = [ data.formatter ];
        if (data.legend) data.legend = [ data.legend ];

        res.send(res.model);
    }
});

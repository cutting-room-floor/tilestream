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

        var load = this.load.bind(this);
        this.config = app.config;
        this.config.header = { 'Cache-Control': 'max-age=' + 60 * 60 };
        this.get('/1.0.0/:tileset/:z/:x/:y.(png|jpg|jpeg|grid.json)', load, this.tile.bind(this));
        this.get('/1.0.0/:tileset/layer.json', load, this.tile.bind(this));
        this.get('/download/:tileset.mbtiles', load, this.download.bind(this));
        this.get('/status', this.status);
    },

    // Basic route for checking the health of the server.
    status: function(req, res, next) {
        res.send('TileStream', 200);
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
            return err && next(err);
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

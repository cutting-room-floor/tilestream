// Routes for the tile server. Suitable for HTTP cacheable content with a
// long TTL.
var Step = require('step'),
    fs = require('fs'),
    path = require('path'),
    tilelive = new (require('tilelive').Server)(require('tilelive-mbtiles'));

router = Bones.Router.extend({
    initialize: function(options) {
        var load = this.load.bind(this);
        this.config = options.plugin.config;
        this.config.header = { 'Cache-Control': 'max-age=' + 60 * 60 };
        this.server.get('/1.0.0/:tileset/:z/:x/:y.(png|jpg|jpeg|grid.json)', load, this.tile.bind(this));
        this.server.get('/1.0.0/:tileset/layer.json', load, this.tile.bind(this));
        this.server.get('/download/:tileset.mbtiles', load, this.download.bind(this));
        this.server.get('/status', this.status);
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
        tilelive.serve(options, function(err, data) {
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


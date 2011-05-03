// Routes for the tile server. Suitable for HTTP cacheable content with a
// long TTL.
var Step = require('step'),
    fs = require('fs'),
    path = require('path'),
    Tile = require('tilelive').Tile;

router = Bones.Router.extend({
    initialize: function(options) {
        var load = _(this.load).bind(this);
        this.config = options.plugin.config;
        this.config.header = { 'Cache-Control': 'max-age=' + 60 * 60 };
        this.server.get('/1.0.0/:tileset/:z/:x/:y.(png|jpg|jpeg)', load, _(this.tile).bind(this));
        this.server.get('/1.0.0/:tileset/:z/:x/:y.grid.json', load, _(this.grid).bind(this));
        this.server.get('/1.0.0/:tileset/layer.json', load, _(this.layer).bind(this));
        this.server.get('/download/:tileset.mbtiles', load, _(this.download).bind(this));
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
            success: _(function(model) {
                res.model = model;
                res.mapfile = model.filepath(this.config.tiles);
                next();
            }).bind(this),
            error: _(function(model, err) {
                next(err);
            }).bind(this)
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
        var tile = new Tile({
            type: 'mbtiles',
            datasource: res.mapfile,
            format: req.params[4],
            xyz: [req.param('x'), req.param('y'), req.param('z')]
        });
        tile.render(function(err, data) {
            if (!err) {
                res.send(data[0], _.extend({},
                    res.model.get('headers'),
                    config.header,
                    data[1]));
            } else if (err.toString() === 'Tile does not exist') {
                res.send('Not found.', 404);
            } else {
                res.send(err.toString(), 500);
            }
        });
    },
    // Load a tileset layer.json manifest.
    layer: function(req, res, next) {
        req.query.callback = req.query.callback || 'grid';
        var config = this.config;
        var tile = new Tile({
            type: 'mbtiles',
            datasource: res.mapfile,
            format: 'layer.json',
        });
        tile.render(function(err, data) {
            if (!err) {
                res.send(data, _.extend(
                    { 'Content-Type': 'text/javascript' },
                    res.model.get('headers'),
                    config.header
                ));
            } else if ((err.toString() === 'Key does not exist') || !data) {
                res.send('layer.json not found', 404);
            } else {
                res.send(err.toString(), 500);
            }
        });
    },
    // Load an interaction grid tile.
    grid: function(req, res, next) {
        req.query.callback = req.query.callback || 'grid';
        var config = this.config;
        var tile = new Tile({
            type: 'mbtiles',
            datasource: res.mapfile,
            format: 'grid.json',
            xyz: [req.param('x'), req.param('y'), req.param('z')]
        });
        tile.render(function(err, data) {
            if (!err) {
                res.send(
                    req.query.callback + '(' + data + ');',
                    _.extend(
                        {'Content-Type': 'text/javascript; charset=utf-8'},
                        res.model.get('headers'),
                        config.header
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
    }
});


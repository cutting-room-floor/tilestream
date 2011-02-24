// Routes for the UI server. Suitable for dynamic content that should not be
// cached aggressively.
var models = require('models'),
    Router = require('controllers').Router;

module.exports = function(server, settings) {
    // Set up the backbone router
    new Router();

    // Send settings to the browser.
    server.get('/settings.js', function(req, res, next) {
        res.send(
            require('settings').toJS(),
            { 'Content-Type': 'text/javascript' }
        );
    });

    // GET endpoint for TilesetList collection.
    server.get('/api/tileset', function(req, res, next) {
        var tilesets = new models.TilesetList();
        tilesets.fetch({
            success: function(model, resp) { res.send(model.toJSON()) },
            error: function(model, resp) { res.send(resp, 500); }
        });
    });

    // GET endpoint for Tileset model.
    server.get('/api/tileset/*', function(req, res, next) {
        var tileset = new models.Tileset({ id: req.params[0] });
        tileset.fetch({
            success: function(model, resp) { res.send(model.toJSON()) },
            error: function(model, resp) { res.send(resp, 500); }
        });
    });
}

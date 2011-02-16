// Routes for the UI server. Suitable for dynamic content that should not be
// cached aggressively.
var models = require('models-server'),
    Router = require('controllers').Router,
    Backbone = require('backbone-server');

module.exports = function(server, settings) {
    // Set up the backbone router
    new Router();
    server.use(Backbone.history.middleware());

    // Return compiled templates to the client-side application.
    server.get('/templates.js', function(req, res, next) {
        res.send(
            require('templates')(settings).toJS(),
            { 'Content-Type': 'text/javascript' }
        );
    });

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

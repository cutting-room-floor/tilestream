// Routes for the UI server. Suitable for dynamic content that should not be
// cached aggressively.
var models = require('models'),
    Router = require('controllers').Router;

module.exports = function(server, settings) {
    // Set up the backbone router
    new Router();

    // Route middleware for validating a model.
    function validateModel(req, res, next) {
        if (models[req.param('model')]) {
            next();
        } else {
            next(new Error('Invalid model.'));
        }
    };

    // Route middleware for validating a collection.
    function validateCollection(req, res, next) {
        if (models[req.param('model') + 'List']) {
            next();
        } else {
            next(new Error('Invalid collection.'));
        }
    };

    // Send settings to the browser.
    server.get('/settings.js', function(req, res, next) {
        res.send(
            require('settings').toJS(),
            { 'Content-Type': 'text/javascript' }
        );
    });

    // Generic GET endpoint for collection loading.
    server.get('/api/:model', validateCollection, function(req, res, next) {
        var list = new models[req.param('model') + 'List']({ id: req.params[0] });
        list.fetch({
            success: function(model, resp) { res.send(model.toJSON()) },
            error: function(model, resp) { res.send(resp, 500); }
        });
    });

    // Generic GET endpoint for model loading.
    server.get('/api/:model/*', validateModel, function(req, res, next) {
        var model = new models[req.param('model')]({ id: req.params[0] });
        model.fetch({
            success: function(model, resp) { res.send(model.toJSON()) },
            error: function(model, resp) { res.send(resp, 500); }
        });
    });

    // Generic POST endpoint for model creation.
    server.post('/api/:model/*', validateModel, function(req, res, next) {
        var model = new models[req.param('model')]({ id: req.params[0] });
        model.save(req.body, {
            success: function(model, resp) { res.send(resp) },
            error: function(model, resp) { res.send(resp, 500); }
        });
    });

    // Generic PUT endpoint for model update.
    server.put('/api/:model/*', validateModel, function(req, res, next) {
        var model = new models[req.param('model')]({ id: req.params[0] });
        model.save(req.body, {
            success: function(model, resp) { res.send(resp) },
            error: function(model, resp) { res.send(resp, 500); }
        });
    });

    // Generic DELETE endpoint for model deletion.
    server.del('/api/:model/*', validateModel, function(req, res, next) {
        var model = new models[req.param('model')]({ id: req.params[0] });
        model.destroy({
            success: function(model, resp) { res.send({}) },
            error: function(model, resp) { res.send(resp, 500); }
        });
    });
}


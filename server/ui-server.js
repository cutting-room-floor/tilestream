// Routes for the UI server. Suitable for dynamic content that should not be
// cached aggressively.
var fs = require('fs'),
    path = require('path'),
    express = require('express'),
    mirror = require('mirror'),
    Bones = require('bones'),
    controllers = require('../mvc/controllers'),
    models = require('../mvc/models');

module.exports = function(server, settings) {
    server.enable('jsonp callback');

    // Initialize bones, bones templates, server-side mixins.
    Bones.Bones(server);
    Bones.settings = settings;
    require('./models-server')(settings);

    // Add templates to the Bones template cache.
    var templatePath = path.join(__dirname, '..', 'templates'),
        templateFiles = fs.readdirSync(templatePath);
    for (var i = 0; i < templateFiles.length; i++) {
        var key = path.basename(templateFiles[i], '.hbs');
        Bones.templates[key] = fs.readFileSync(
            path.join(templatePath, templateFiles[i]),
            'utf-8'
        );
    }

    // Set up the backbone router
    new controllers.Router();

    // Static assets, mirrored module assets, and options mirrored to client.
    server.use(express.staticProvider(path.join(__dirname, '..', 'client')));
    server.get('/vendor.js', mirror.assets([
        'tilestream/client/js/jquery.js',
        'underscore/underscore.js',
        'backbone/backbone.js',
        'handlebars/handlebars.js',
        'bones/bones.js',
        'openlayers_slim/OpenLayers.js',
        'wax/control/lib/gridutil.js',
        'wax/build/wax.ol.min.js',
        'wax/lib/record.js',
        'tilestream/mvc/controllers.js',
        'tilestream/mvc/models.js',
        'tilestream/mvc/views.js',
        'tilestream/client/js/app.js'
    ]));
    server.get('/vendor.css', mirror.assets(['wax/theme/controls.css']));
    server.get('/theme/default/style.css', mirror.file('openlayers_slim/theme/default/style.css'));
    server.get('/settings.js', function(req, res, next) {
        res.send(
            'var Bones = Bones || {};\n' +
            'Bones.settings = ' + JSON.stringify(settings) + ';',
            { 'Content-Type': 'text/javascript' }
        );
    });

    // Add map wax endpoint.
    require('./wax')(server, settings);

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
        if (models[req.param('model') + 'List'] || models[req.param('model') + 's']) {
            next();
        } else {
            next(new Error('Invalid collection.'));
        }
    };

    // Generic GET endpoint for collection loading.
    server.get('/api/:model', validateCollection, function(req, res, next) {
        var Collection = models[req.param('model') + 'List'] || models[req.param('model') + 's'];
        var list = new Collection([], { id: req.params[0] });
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


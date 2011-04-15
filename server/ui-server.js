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
    if (settings.syslog) {
        var logger = require('syslog').createClient(514, 'localhost', { name: 'tilestream' });
        server.error(function(err, req, res, next) {
            err.method = req.method;
            err.url = req.url;
            err.headers = req.headers;
            logger.error(JSON.stringify(err));
            next();
        });
    }

    server.enable('jsonp callback');
    server.error(Error.HTTP.handler(settings));

    // Initialize bones, bones templates, server-side mixins.
    Bones.Bones(server);
    Bones.settings = settings;
    require('../mvc/models-server')(settings);

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
        'tilestream/mvc/models.js',
        'tilestream/mvc/views.js',
        'tilestream/mvc/controllers.js',
        'tilestream/client/js/app.js'
    ]));
    server.get('/theme/default/style.css', mirror.file('openlayers_slim/theme/default/style.css'));

    // Settings endpoint. Send information that need to be shared between
    // server/client.
    server.get('/settings.js', function(req, res, next) {
        var pub = {
            uiHost: req.uiHost,
            tileHost: req.tileHost,
            features: settings.features
        };
        res.send(
            'var Bones = Bones || {};\n' +
            'Bones.settings = ' + JSON.stringify(pub) + ';',
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
            next(new Error.HTTP('Invalid model.', 400));
        }
    };

    // Route middleware for validating a collection.
    function validateCollection(req, res, next) {
        if (models[req.param('model') + 'List'] || models[req.param('model') + 's']) {
            next();
        } else {
            next(new Error.HTTP('Invalid collection.', 400));
        }
    };

    // Generic GET endpoint for collection loading.
    var getCollection = function(req, res, next) {
        req.model = req.model || {};
        req.model.options = req.model.options || {};
        var Collection = models[req.param('model') + 'List'] || models[req.param('model') + 's'];
        var list = new Collection([], req.model.options);
        list.fetch({
            success: function(model, resp) { res.send(model.toJSON()) },
            error: function(model, err) { next(err); }
        });
    };
    server.get('/api/:model', validateCollection, getCollection);
    server.get('/v1/:model', validateCollection, getCollection);

    // REST endpoints for models.
    var getModel = function(req, res, next) {
        req.model = req.model || {};
        req.model.options = req.model.options || {};
        var model = new models[req.param('model')]({ id: req.params[0] }, req.model.options);
        switch (req.method) {
        case 'GET':
            model.fetch({
                success: function(model, resp) { res.send(model.toJSON()) },
                error: function(model, err) { next(err); }
            });
            break;
        case 'POST':
        case 'PUT':
            model.save(req.body, {
                success: function(model, resp) { res.send(resp) },
                error: function(model, err) { next(err); }
            });
            break;
        case 'DELETE':
            model.destroy({
                success: function(model, resp) { res.send({}) },
                error: function(model, err) { next(err); }
            });
            break;
        }
    };
    server.all('/api/:model/*', validateModel, getModel);
    server.all('/v1/:model/*', validateModel, getModel);
}


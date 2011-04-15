// Requires for the server-side context. *TODO* Note that `var` is omitted here
// because even within the `if()` IE will wipe globally defined variables if
// `var` is included, leaving us with broken objects.
if (typeof require !== 'undefined') {
    _ = require('underscore')._,
    Backbone = require('backbone.js'),
    Bones = require('bones'),
    require('./models'), // Bones mixin.
    require('./views'); // Bones mixin.
}

var Bones = Bones || {};
Bones.controllers = Bones.controllers || {};

Bones.controllers.Router = Backbone.Controller.extend({
    Collection: Bones.models.Tilesets,
    Model: Bones.models.Tileset,
    initialize: function(options) {
        _.bindAll(this, 'list', 'map', 'getOptions');
    },
    getOptions: function(response) {
        var options = {};
        if (response.req && response.req.model && response.req.model.options) {
            options = response.req.model.options;
        } else if (Bones.settings) {
            options = Bones.settings;
        }
        return options;
    },
    routes: {
        '': 'list',
        '/': 'list',
        '/map/:id': 'map'
    },
    list: function(response) {
        var that = this;
        var options = this.getOptions(response);
        (new this.Collection([], options)).fetch({
            success: function(collection) {
                options.view = new Bones.views.Maps({ collection: collection });
                response(new Bones.views.App(options));
            },
            error: function(model, xhr) {
                try { var r = JSON.parse(xhr.responseText); }
                catch(err) { var r = { message: 'Server is offline.' }; }

                options.view = new Bones.views.Error({ message: r.message });
                response(new Bones.views.App(options));
            }
        });
    },
    map: function(id, response) {
        var that = this;
        var options = this.getOptions(response);
        (new this.Model({ id: id }, options)).fetch({
            success: function(model) {
                options.view = new Bones.views.Map({ model: model });
                response(new Bones.views.App(options));
            },
            error: function(model, xhr) {
                try { var r = JSON.parse(xhr.responseText); }
                catch(err) { var r = { message: 'Server is offline.' }; }

                options.view = new Bones.views.Error({ message: r.message });
                response(new Bones.views.App(options));
            }
        });
    }
});

(typeof module !== 'undefined') && (module.exports = Bones.controllers);


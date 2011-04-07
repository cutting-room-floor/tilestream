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
                var view = new Bones.views.Maps({ collection: collection });
                response(new Bones.views.App({ view: view }));
            },
            error: function(model, xhr) {
                try { var response = JSON.parse(xhr.responseText); }
                catch(err) { var response = { message: 'Server is offline.' }; }

                var view = new Bones.views.Error({ message: response.message });
                response(new Bones.views.App({ view: view }));
            }
        });
    },
    map: function(id, response) {
        var that = this;
        var options = this.getOptions(response);
        (new this.Model({ id: id }, options)).fetch({
            success: function(model) {
                var view = new Bones.views.Map({ model: model });
                response(new Bones.views.App({ view: view }));
            },
            error: function(model, xhr) {
                try { var response = JSON.parse(xhr.responseText); }
                catch(err) { var response = { message: 'Server is offline.' }; }

                var view = new Bones.views.Error({ message: response.message });
                response(new Bones.views.App({ view: view }));
            }
        });
    }
});

(typeof module !== 'undefined') && (module.exports = Bones.controllers);


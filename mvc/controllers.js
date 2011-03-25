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
    initialize: function(options) {
        _.bindAll(this, 'list', 'tileset');
    },
    routes: {
        '': 'list',
        '/': 'list',
        '/map/:id': 'map'
    },
    list: function(response) {
        var that = this;
        (new Bones.models.Tilesets()).fetch({
            success: function(collection) {
                var view = new Bones.views.Maps({ collection: collection });
                response(new Bones.views.App({ view: view }));
            },
            error: function() {
                var view = new Bones.views.Error({ message: 'Error loading tilesets.' });
                response(new Bones.views.App({ view: view }));
            }
        });
    },
    map: function(id, response) {
        var that = this;
        (new Bones.models.Tileset({ id: id })).fetch({
            success: function(model) {
                var view = new Bones.views.Map({ model: model });
                response(new Bones.views.App({ view: view }));
            },
            error: function() {
                var view = new Bones.views.Error({ message: 'Tileset not found.' });
                response(new Bones.views.App({ view: view }));
            }
        });
    }
});

(typeof module !== 'undefined') && (module.exports = Bones.controllers);


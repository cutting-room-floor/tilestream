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
                options.collection = collection;
                options.view = new Bones.views.Maps(options);
                response(new Bones.views.App(options));
            },
            error: _(this.error).bind({options: options, response: response})
        });
    },
    map: function(id, response) {
        var that = this;
        var options = this.getOptions(response);
        (new this.Model({ id: id }, options)).fetch({
            success: function(model) {
                options.model = model;
                options.view = new Bones.views.Map(options);
                response(new Bones.views.App(options));
            },
            error: _(this.error).bind({options: options, response: response})
        });
    },
    // Error view callback. Must have `this.response` and `this.options`.
    error: function(model, xhr) {
        var options = this.options;
        try { options.error = JSON.parse(xhr.responseText).message; }
        catch(err) { options.error = 'Connection problem.'; }

        options.view = new Bones.views.Error(options);
        this.response(new Bones.views.App(options));
    }
});

(typeof module !== 'undefined') && (module.exports = Bones.controllers);


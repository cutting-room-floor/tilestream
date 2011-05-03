controller = Backbone.Controller.extend({
    initialize: function(options) {
        _.bindAll(this, 'list', 'map', 'getOptions');
        this.Collection = models.Tilesets;
        this.Model =  models.Tileset;
        Backbone.Controller.prototype.initialize.call(this, options);
    },
    getOptions: function(response) {
        var options = {};
        if (response.req && response.req.model && response.req.model.options) {
            options = response.req.model.options;
        // @TODO.
        } else if (Bones.settings) {
            options = Bones.settings;
        // @TODO stopgap.
        } else {
            options = { basepath: '/' };
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
                options.view = new views.Maps(options);
                response((new views.App(options)).el);
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
                options.view = new views.Map(options);
                response((new views.App(options)).el);
            },
            error: _(this.error).bind({options: options, response: response})
        });
    },
    // Error view callback. Must have `this.response` and `this.options`.
    error: function(model, xhr) {
        var options = this.options;
        try { options.error = JSON.parse(xhr.responseText).message; }
        catch(err) { options.error = 'Connection problem.'; }

        options.view = new views.Error(options);
        this.response((new views.App(options)).el);
    }
});


controller = Backbone.Controller.extend({
    initialize: function(options) {
        this.Collection = models.Tilesets;
        this.Model =  models.Tileset;
        Backbone.Controller.prototype.initialize.call(this, options);
    },
    getOptions: function() {
        var options = {};
        if (this.req && this.req.query) {
            options = this.req.query;
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
    list: function() {
        var options = this.getOptions();
        (new this.Collection([], options)).fetch({
            success: _.bind(function(collection) {
                options.collection = collection;
                options.view = new views.Maps(options);
                var view = new views.App(options);
                this.res && this.res.send(view.el);
            }, this),
            error: _.bind(this.error, this)
        });
    },
    map: function(id) {
        var options = this.getOptions();
        (new this.Model({ id: id }, options)).fetch({
            success: _.bind(function(model) {
                options.model = model;
                options.view = new views.Map(options);
                var view = new views.App(options);
                this.res && this.res.send(view.el);
            }, this),
            error: _.bind(this.error, this)
        });
    },
    // Error view callback. Must have `this.response` and `this.options`.
    error: function(model, xhr) {
        var options = this.getOptions();
        try { options.error = JSON.parse(xhr.responseText).message; }
        catch(err) { options.error = 'Connection problem.'; }

        options.view = new views.Error(options);
        var view = new views.App(options);
        this.res && this.res.send(view.el);
    }
});


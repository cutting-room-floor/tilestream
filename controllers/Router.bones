controller = Backbone.Controller.extend({
    initialize: function(options) {
        this.Collection = models.Tilesets;
        this.Model =  models.Tileset;
        (typeof req !== 'undefined') && (this.req = req);
        Backbone.Controller.prototype.initialize.call(this, options);
    },
    routes: {
        '': 'list',
        '/': 'list',
        '/map/:id': 'map'
    },
    list: function() {
        var options = _(this.req.query).clone();
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
        var options = _(this.req.query).clone();
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
    error: function(model, xhr) {
        var options = _(this.req.query).clone();
        options.error = 'Connection problem.';
        try {
            var resp = JSON.parse(xhr.responseText);
            options.error = resp.message || (resp.error && resp.error.message);
        } catch(err) {}

        options.view = new views.Error(options);
        var view = new views.App(options);
        this.res && this.res.send(view.el);
    }
});


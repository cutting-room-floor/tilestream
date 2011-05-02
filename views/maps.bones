// Maps
// ----
// View showing each map as a thumbnail. Main map browsing page.
view = views.Hud.extend({
    initialize: function(options) {
        views.Hud.prototype.initialize.call(this, options);
        _.bindAll(this, 'render');
        this.render().trigger('attach');
    },
    render: function() {
        $(this.el).html(this.template('Maps', _({
            maps: this.collection.map(function(model) {
                return {
                    basepath: model.options.basepath,
                    id: model.get('id'),
                    name: model.get('name'),
                    thumb: model.thumb()
                };
            })
        }).extend(this.options)));
        var that = this;
        return this;
    }
});


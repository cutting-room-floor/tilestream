// ErrorView
// ---------
// Error view.
view = Backbone.View.extend({
    initialize: function(options) {
        _.bindAll(this, 'render');
        this.render().trigger('attach');
    },
    render: function() {
        $(this.el).html(this.template('Error', this.options));
        return this;
    }
});


// MapPreview
// ----------
// A web map client for displaying tile-based maps.
view = Backbone.View.extend({
    className: 'MapClient',
    id: 'map',
    initialize: function(options) {
        _.bindAll(this, 'ready', 'record', 'mm', 'mmNav');
    },
    ready: function() {
        var that = this;
        $.ajax({
            dataType: 'jsonp',
            url: this.waxURL(this.generateWax()),
            context: this,
            callback: 'grid',
            callbackParameter: 'callback',
            success: this.record,
            error: function() {}
        });
    },
    waxURL: function(wax) {
        return this.model.options.uiHost + 'api/wax.json?' + $.param(wax);
    },
    generateWax: function(callback) {
        return _(this.model.wax()).extend({el: $(this.el).attr('id')});
    },
    record: function(data) {
        if (data && data.wax) {
            var api = this.generateWax().api;
            this.map = wax.Record(data.wax);
            _(this[api]).isFunction() && this[api]();
        }
    },
    mm: function() {
        this.map.addCallback('zoomed', this.mmNav);
        this.mmNav();
    },
    mmNav: function() {
        if (!$('.zoom').size()) return;
        $('.zoom.active').removeClass('active');
        $('.zoom-' + this.map.getZoom()).addClass('active');
    }
});


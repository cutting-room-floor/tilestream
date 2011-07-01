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
        var wax = this.generateWax();
        if (!wax.layers || wax.layers.length === 0) return;

        $.ajax({
            dataType: 'jsonp',
            url: this.waxURL(wax),
            context: this,
            callback: 'grid',
            callbackParameter: 'callback',
            success: this.record,
            error: function() {}
        });
    },
    // Since this is client-side we cannot use url.format().
    waxURL: function(wax) {
        return 'http://' +
            this.model.options.uiHost +
            this.model.options.basepath +
            'api/wax.json?' +
            $.param(wax);
    },
    generateWax: function(callback) {
        var wax = this.model.wax();
        wax.el = $(this.el).attr('id');
        wax.size && (delete wax.size);
        return wax;
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


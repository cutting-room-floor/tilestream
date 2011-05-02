// MapPreview
// ----------
// A web map client for displaying tile-based maps.
view = Backbone.View.extend({
    className: 'MapClient',
    id: 'openlayers-map',
    initialize: function(options) {
        _.bindAll(this, 'ready', 'zoom', 'record', 'ol', 'olNav');
    },
    ready: function() {
        var that = this;
        $.jsonp({
            url: this.waxURL(this.generateWax()),
            context: this,
            callback: 'grid',
            callbackParameter: 'callback',
            success: this.record,
            error: function() {}
        });
    },
    waxURL: function(wax) {
        return Bones.settings.uiHost + 'api/wax.json?' + $.param(wax);
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
    ol: function() {
        this.map.events.register('moveend', this.map, this.olNav);
        this.map.events.register('zoomend', this.map, this.olNav);
        this.olNav({element: this.map.div});
    },
    olNav: function(e) {
        if (!$('.zoom').size()) return;
        var zoom = this.model.get('minzoom') + this.map.getZoom();
        $('.zoom.active').removeClass('active');
        $('.zoom-' + zoom).addClass('active');
    }
});


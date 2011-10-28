// MapPreview
// ----------
// A web map client for displaying tile-based maps.
view = Backbone.View.extend({
    className: 'MapClient',
    id: 'map',
    initialize: function(options) {
        _.bindAll(this, 'ready', 'mm', 'mmNav');
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
            success: this.render,
            error: function() {}
        });
    },
    render: function(data) {
        console.log(arguments);
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
    mm: function() {
        this.map.addCallback('zoomed', this.mmNav);
        this.map.addCallback('extentset', this.mmNav);
        this.mmNav();
    },
    mmNav: function() {
        if (!$('.zoom').size()) return;
        $('.zoom.active').removeClass('active');
        $('.zoom-' + this.map.getZoom()).addClass('active');
    }
});

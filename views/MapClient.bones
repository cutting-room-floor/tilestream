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
    waxURL: function(wax) {
        return this.model.options.uiHost + 'api/wax.json?' + $.param(wax);
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

        // Calculate the background luminosity from the first tile.
        setTimeout(function() {
            var tile = this.$('img:first')[0];
            if (!tile) return;
            if (tile.complete) setBackground();
            else $(tile).load(setBackground);

            function setBackground() {
                if (view.alphaImageLuminosity(tile) > 0.8) {
                    $(tile).closest('.MapClient').css({ backgroundColor: 'black' });
                }
            }
        }.bind(this), 0);
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

// Calculates the luminosity (0-1) of all semi-transparent pixels.
view.alphaImageLuminosity = function(el) {
    if (!HTMLCanvasElement || !el.complete) return -1;

    var canvas = document.createElement('canvas');
    canvas.setAttribute('width', el.width);
    canvas.setAttribute('height', el.height);
    var c = canvas.getContext('2d');
    c.drawImage(el, 0, 0);

    var r = 0, g = 0, b = 0, total = 0;
    var pixels = c.getImageData(0, 0, el.width, el.height).data;

    // Look at every pixel's alpha value and only proceed if it is semi-transparent.
    for (var i = 3; i < pixels.length; i += 4) {
        if (pixels[i] < 255 && pixels[i] > 0) {
            total++;
            r += pixels[i - 3];
            g += pixels[i - 2];
            b += pixels[i - 1];
        }
    }

    if (!total) return 0;

    // Calculate average luminosity of all alpha pixels.
    // Using the median of all per-pixel luminosities would be better but is
    // computationally much more expensive and since this runs in the UI thread,
    // is not an option at this point.
    return Math.pow(r / total / 255, 2.2) * 0.2126 +
           Math.pow(g / total / 255, 2.2) * 0.7152 +
           Math.pow(b / total / 255, 2.2) * 0.0722;
};

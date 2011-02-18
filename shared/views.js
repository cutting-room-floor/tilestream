// Backbone Views to be used both client/server side. The following conventions
// must be followed in order to ensure that the views can be used in both
// environments:
//
// - Use `render()` only for templating. Any DOM event handlers, other
//   js library initialization (e.g. OpenLayers) should be done in the
//   `attach()` method.
// - `render()` must `return this` in order to be chainable and any calls to
//   `render()` should chain `trigger('attach')`.
// - `templateName` should refer to a corresponding handlebars.js `.hbs`
//   template file in the `templates/` directory.
// - `template()` should be used to render an object using the template
//   specified in `templateName`. Avoid using jquery or other doing other DOM
//   element creation if templating could get the job done.
//
// See `client/js/app.js` and `server/backbone-server.js` for all the specific
// overrides to `Backbone.Views` for each context.

// Requires for the server-side context. *TODO* Note that `var` is omitted here
// because even within the `if()` IE will wipe globally defined variables if
// `var` is included, leaving us with broken objects.
if (typeof require !== 'undefined') {
    Settings = require('settings'),
    Backbone = require('backbone-server.js'),
    _ = require('underscore')._;
}

// PageView
// --------
// View representing the entire page viewport. The view that should "fill" the
// viewport should be passed as `options.view`. When the View's element has
// been successfully added to the DOM a `ready` event will be triggered on that
// view.
var PageView = Backbone.View.extend({
    initialize: function(options) {
        _.bindAll(this, 'render');
        Backbone.View.prototype.initialize.call(this, options);
        this.render().trigger('attach');
    },
    render: function() {
        $('#app').html(this.options.view.el);
        this.options.view.trigger('ready');
        return this;
    }
});

// ErrorView
// ---------
// Error view.
var ErrorView = Backbone.View.extend({
    templateName: 'ErrorView',
    initialize: function(options) {
        _.bindAll(this, 'render');
        Backbone.View.prototype.initialize.call(this, options);
        this.render().trigger('attach');
    },
    render: function() {
        $(this.el).html(this.template({
            message: this.options.message
        }));
        return this;
    }
});

// OpenLayersView
// --------------
//
var OpenLayersView = Backbone.View.extend({
    templateName: 'OpenLayersView',
    id: 'openlayers-map',
    initialize: function(options) {
        Backbone.View.prototype.initialize.call(this, options);
        _.bindAll(this, 'ready');
    },
    ready: function() {
        $(this.el).attr('src', this.waxURL(this.generateWax()));
        $(this.el).each(OpenLayersWax.bind);
    },
    waxURL: function(wax) {
        var path = 'wax.json?' + $.param(wax);
        if (window.location && window.location.hostname) {
            var baseURL = window.location.protocol + '//' + window.location.hostname + ':' + Settings.port;
            return baseURL + '/' + path;
        }
    },
    generateWax: function(callback) {
        var wax = {
            el: $(this.el).attr('id'),
            layers: [this.model.id],
            center: [this.model.get('center').lon, this.model.get('center').lat],
            zoom: 0
        };
        if (this.model.get('type') === 'overlay') {
            if (this.model.get('baselayer')) {
                var baselayer = this.model.get('baselayer');
                // Ensure the zoom levels of the baselayer intersect with those
                // of the overlay.
                if (
                    _.intersect(
                        _.range(this.model.get('minzoom'), this.model.get('maxzoom')),
                        _.range(baselayer.get('minzoom'), baselayer.get('maxzoom'))
                    ).length === 0
                ) {
                    var view = new ErrorView({ message: 'The default baselayer does not cover enough zoom levels.' });
                    new PageView({ view: view });
                }
                wax.layers.push(baselayer.id);
            }
            else {
                var view = new ErrorView({ message: 'No default baselayer set.' });
                new PageView({ view: view });
            }
        }
        wax.zoom = this.model.get('minzoom') < 2 ? 2 : 0;
        return wax;
    },
});

// TilesetView
// -------
// View for exploring a single Tileset. Provides a fullscreen OpenLayers UI with
// HUD panels for enabled features (e.g. info, download, etc.)
var TilesetView = Backbone.View.extend({
    templateName: 'TilesetView',
    initialize: function(options) {
        Backbone.View.prototype.initialize.call(this, options);
        _.bindAll(this, 'render', 'ready', 'controlZoom', 'format');
        this.render().trigger('attach');
    },
    events: {
        'click .buttons a': 'hud'
    },
    hud: function(ev) {
        var that = this;
        var link = $(ev.currentTarget);
        var hud = !link.is('.active')
            ? link.attr('href').split('#').pop()
            : false;

        // Start by hiding active HUDs.
        this.$('.buttons .active').removeClass('active');
        this.$('.hud.active').removeClass('active').fadeOut();

        // If a HUD for activation has been specified, activate it.
        if (hud) {
            link.addClass('active');
            that.$('.hud.' + hud).fadeIn(function() {
                $(this).addClass('active');
            });
        }
        return false;
    },
    format: function(type, value) {
        switch (type) {
        case 'deg':
            return parseInt(value * 100, 10) * .01;
            break;
        case 'url':
            var that = this;
            return _.map(this.model.layerURL(), function(layer) {
                return layer + '1.0.0/' + that.model.get('id') + '/{z}/{x}/{y}';
            });
            break;
        case 'download':
            return this.model.layerURL()[0]
                + 'download/'
                + this.model.get('id')
                + '.mbtiles';
            break;
        case 'size':
            return (Math.ceil(parseInt(this.model.get('size')) / 1048576)) + ' MB';
            break;
        }
    },
    render: function() {
        $(this.el).html(this.template({
            features: Settings.features,
            id: this.model.get('id'),
            name: this.model.get('name'),
            zoom: _.range(this.model.get('minzoom'), this.model.get('maxzoom') + 1),
            description: this.model.get('description') || null,
            type: this.model.get('type') || null,
            bounds: {
                w: this.format('deg', this.model.get('bounds')[0]),
                s: this.format('deg', this.model.get('bounds')[1]),
                e: this.format('deg', this.model.get('bounds')[2]),
                n: this.format('deg', this.model.get('bounds')[3])
            },
            url: this.format('url'),
            download: this.format('download'),
            size: this.format('size')
        }));

        this.map = new OpenLayersView({model: this.model});
        this.bind('ready', this.map.ready);
        $(this.map.el).bind('openlayersWaxFinished', this.ready);
        $(this.el).append(this.map.el);

        return this;
    },
    ready: function() {
        this.openlayers = $(this.map.el).data('map');

        // Add interactivity
        var interaction = new OpenLayers.Control.Interaction();
        this.openlayers.addControl(interaction);
        interaction.activate();

        // Add legends
        var legend = new OpenLayers.Control.Legend();
        this.openlayers.addControl(legend);
        legend.activate();

        this.controlZoom({
            element: this.map.div
        });
        this.openlayers.events.register('moveend', this.openlayers, this.controlZoom);
        this.controlZoom({element: this.openlayers.div});
        this.openlayers.events.register('zoomend', this.openlayers, this.controlZoom);

        return this;
    },
    controlZoom: function(e) {
        var zoom = this.model.get('minzoom') + this.openlayers.getZoom();
        this.$('.zoom.active').removeClass('active');
        this.$('.zoom-' + zoom).addClass('active');
    }
});

// TilesetListView
// -----------
// View showing each tileset as a thumbnail. Main tileset browsing page.
var TilesetListView = Backbone.View.extend({
    id: 'TilesetList',
    templateName: 'TilesetListView',
    initialize: function(options) {
        Backbone.View.prototype.initialize.call(this, options);
        _.bindAll(this, 'render');
        this.render().trigger('attach');
    },
    render: function() {
        $(this.el).html(this.template());
        var that = this;
        this.collection.each(function(tileset) {
            tileset.view = new TilesetRowView({ model: tileset });
            $('ul.tilesets', that.el).append(tileset.view.el);
        });
        return this;
    }
});

// TilesetRowView
// ----------
// View for a single tileset in a TilesetListView.
var TilesetRowView = Backbone.View.extend({
    tagName: 'li',
    className: 'clearfix',
    templateName: 'TilesetRowView',
    initialize: function(options) {
        Backbone.View.prototype.initialize.call(this, options);
        this.render().trigger('attach');
    },
    render: function() {
        $(this.el).html(this.template(this.model.attributes));
        return this;
    },
    attach: function() {
        this.$('span.thumb').css({
            'backgroundImage': 'url(' + this.thumb() + ')'
        });
    },
    // Single tile thumbnail URL generation. From [OSM wiki][1].
    // [1]: http://wiki.openstreetmap.org/wiki/Slippy_map_tilenames#lon.2Flat_to_tile_numbers_2
    thumb: function() {
        var center = this.model.get('center');
        center.lat = -1 * center.lat; // TMS is flipped from OSM calc below.
        var z = this.model.get('minzoom');
        var lat_rad = center.lat * Math.PI / 180;
        var x = parseInt((center.lon + 180.0) / 360.0 * Math.pow(2, z));
        var y = parseInt((1.0 - Math.log(Math.tan(lat_rad) + (1 / Math.cos(lat_rad))) / Math.PI) / 2.0 * Math.pow(2, z));

        return this.model.layerURL()[0] + ['1.0.0', this.model.get('id'), z, x, y].join('/') + '.png';
    }
});

if (typeof module !== 'undefined') {
    module.exports = {
        PageView: PageView,
        ErrorView: ErrorView,
        TilesetView: TilesetView,
        TilesetListView: TilesetListView,
        TilesetRowView: TilesetRowView
    };
}

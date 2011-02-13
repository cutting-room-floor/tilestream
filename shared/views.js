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

// MapView
// -------
// View for exploring a single Map. Provides a fullscreen OpenLayers UI with
// HUD panels for enabled features (e.g. info, download, etc.)
var MapView = Backbone.View.extend({
    templateName: 'MapView',
    initialize: function(options) {
        Backbone.View.prototype.initialize.call(this, options);
        _.bindAll(this, 'render', 'ready', 'controlZoom', 'format');
        this.bind('ready', this.ready);
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
            return this.model.layerURL().shift()
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
        return this;
    },
    ready: function() {
        var options = {
            projection: new OpenLayers.Projection('EPSG:900913'),
            displayProjection: new OpenLayers.Projection('EPSG:4326'),
            units: 'm',
            maxExtent: new OpenLayers.Bounds(
                -20037500,
                -20037500,
                20037500,
                20037500
            ),
            controls: []
        };

        // Nav control images.
        OpenLayers.ImgPath = 'images/openlayers_dark/';

        var serverResolutions = [
            156543.0339, 78271.51695, 39135.758475, 19567.8792375, 9783.93961875,
            4891.96980938, 2445.98490469, 1222.99245234, 611.496226172,
            305.748113086, 152.874056543, 76.4370282715, 38.2185141357,
            19.1092570679, 9.55462853394, 4.77731426697, 2.38865713348,
            1.19432856674, 0.597164283371
        ];

        // Set the layer bounds. If the layer bounds exceed that of the world,
        // do not set `maxExtent` as OpenLayers does not render the contiguous
        // dateline-wrapped world correctly in this scenario.
        var bbox = this.model.get('bounds');
        var maxExtent = new OpenLayers.Bounds(bbox[0], bbox[1], bbox[2], bbox[3]).transform(
            new OpenLayers.Projection('EPSG:4326'),
            new OpenLayers.Projection('EPSG:900913')
        );
        var wrapDateLine = false;
        if (
            maxExtent.bottom < -20037500
            && maxExtent.left < -20037500
            && maxExtent.right > 20037500
            && maxExtent.top > 20037500
        ) {
            maxExtent = false;
            wrapDateLine = true;
        }

        this.map = new OpenLayers.Map('map-' + this.model.id, options);
        this.layer = new OpenLayers.Layer.TMS('Preview', this.model.layerURL(), {
            layername: this.model.get('id'),
            type: 'png',
            buffer: 0,
            transitionEffect: 'resize',
            resolutions: serverResolutions.slice(
                this.model.get('minzoom'),
                this.model.get('maxzoom') + 1),
            serverResolutions: serverResolutions,
            wrapDateLine: wrapDateLine,
            maxExtent: maxExtent
        });
        this.map.addLayers([this.layer]);

        // Set the map's initial center point
        var center = this.model.get('center');
        var center = new OpenLayers.LonLat(
            this.model.get('center').lon,
            this.model.get('center').lat);
        center.transform(
            new OpenLayers.Projection('EPSG:4326'),
            this.map.projection
        );

        // Use at least zoom level 2 if possible. Levels 0 & 1 are often not
        // large enough to fill the entire map viewport on a reasonably sized
        // screen.
        if (this.model.get('minzoom') < 2) {
            this.map.setCenter(center, 2);
        } else {
            this.map.setCenter(center, 0);
        }

        // Add custom controls
        var navigation = new OpenLayers.Control.Navigation({
            zoomWheelEnabled: true
        });
        this.map.addControl(navigation);
        navigation.activate();

        // Add interactivity
        var interaction = new OpenLayers.Control.Interaction();
        this.map.addControl(interaction);
        interaction.activate();

        this.controlZoom({
            element: this.map.div
        });
        this.map.events.register('moveend', this.map, this.controlZoom);
        this.controlZoom({element: this.map.div});
        this.map.events.register('zoomend', this.map, this.controlZoom);
        return this;
    },
    controlZoom: function(e) {
        var zoom = this.model.get('minzoom') + this.map.getZoom();
        this.$('.zoom.active').removeClass('active');
        this.$('.zoom-' + zoom).addClass('active');
    }
});

// MapListView
// -----------
// View showing each map as a thumbnail. Main map browsing page.
var MapListView = Backbone.View.extend({
    id: 'MapList',
    templateName: 'MapListView',
    initialize: function(options) {
        Backbone.View.prototype.initialize.call(this, options);
        _.bindAll(this, 'render');
        this.render().trigger('attach');
    },
    render: function() {
        $(this.el).html(this.template());
        var that = this;
        this.collection.each(function(map) {
            map.view = new MapRowView({ model: map });
            $('ul.maps', that.el).append(map.view.el);
        });
        return this;
    }
});

// MapRowView
// ----------
// View for a single map in a MapListView.
var MapRowView = Backbone.View.extend({
    tagName: 'li',
    className: 'clearfix',
    templateName: 'MapRowView',
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
        MapView: MapView,
        MapListView: MapListView,
        MapRowView: MapRowView
    };
}

// Requires for the server-side context. *TODO* Note that `var` is omitted here
// because even within the `if()` IE will wipe globally defined variables if
// `var` is included, leaving us with broken objects.
if (typeof require !== 'undefined') {
    _ = require('underscore')._
    Backbone = require('backbone.js'),
    Bones = require('bones'),
    require('./models'); // Bones mixin.
}

var Bones = Bones || {};
Bones.views = Bones.views || {};

// Add `route()` method for handling normally linked paths into hash paths.
// Because IE7 provides an absolute URL for `attr('href')`, regex out the
// internal path and use it as the fragment.
Backbone.View = Backbone.View.extend({
    events: {
        'click a.route': 'route'
    },
    href: function(el) {
        var href = $(el).get(0).getAttribute('href', 2);
        if ($.browser.msie && $.browser.version < 8) {
            return /^([a-z]+:\/\/.+?)?(\/.+?)$/.exec(href)[2];
        } else {
            return href;
        }
    },
    route: function(ev) {
        var fragment = this.href(ev.currentTarget);
        if (fragment.charAt(0) === '/') {
            var matched = _.any(Backbone.history.handlers, function(handler) {
                if (handler.route.test(fragment)) {
                    handler.callback(fragment);
                    return true;
                }
            });
            if (matched) {
                Backbone.history.saveLocation(fragment);
                return false;
            }
        }
        return true;
    }
});

// App
// ---
// View representing the entire app viewport. The view that should "fill" the
// viewport should be passed as `options.view`. When the View's element has
// been successfully added to the DOM a `ready` event will be triggered on that
// view.
Bones.views.App = Backbone.View.extend({
    initialize: function(options) {
        _.bindAll(this, 'render');
        this.render().trigger('attach');
    },
    render: function() {
        // Server side.
        if (Bones.server) {
            this.el = this.template('App', this.options);
        // Client side.
        } else {
            $('body').attr('class', '');
            $('#app').html(this.options.view.el);
            this.options.view.trigger('ready');
        }
        return this;
    }
});

// ErrorView
// ---------
// Error view.
Bones.views.Error = Backbone.View.extend({
    initialize: function(options) {
        _.bindAll(this, 'render');
        this.render().trigger('attach');
    },
    render: function() {
        $(this.el).html(this.template('Error', this.options));
        return this;
    }
});

// MapPreview
// ----------
// A web map client for displaying tile-based maps.
Bones.views.MapClient = Backbone.View.extend({
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

// HUD
// ---
// Base view that supports toggling on/off HUD displays.
Bones.views.HUD = Backbone.View.extend({
    initialize: function(options) {
        _.bindAll(this, 'hud', 'show', 'hide');
    },
    events: _.extend({
        'click .buttons a': 'hud'
    }, Backbone.View.prototype.events),
    hud: function(ev) {
        var link = $(ev.currentTarget);
        var hud = !link.is('.active')
            ? link.attr('href').split('#').pop()
            : false;
        this.hide();
        (hud) && (this.show(hud));
        return false;
    },
    show: function(hud) {
        this.active = hud;
        $('.buttons a[href=#' + hud + ']').addClass('active');
        this.$('.hud.' + hud).addClass('active');
        $('body').addClass('hudActive');
        $('body').addClass('hud'
            + hud.charAt(0).toUpperCase()
            + hud.slice(1)
        );
        return this;
    },
    hide: function() {
        this.$('.buttons .active').removeClass('active');
        this.$('.hud.active').removeClass('active');
        $('body').removeClass('hudActive');
        if (this.active && this.active.length > 0) {
            $('body').removeClass('hud'
                + this.active.charAt(0).toUpperCase()
                + this.active.slice(1)
            );
            this.active = '';
        }
        return this;
    }
});

// Map
// ---
// View for exploring a single Map. Provides a fullscreen map client with HUD
// panels for enabled features (e.g. info, download, etc.)
Bones.views.Map = Bones.views.HUD.extend({
    initialize: function(options) {
        Bones.views.HUD.prototype.initialize.call(this, options);
        _.bindAll(this, 'render', 'ready', 'controlZoom', 'format');
        this.render().trigger('attach');
    },
    format: function(type, value) {
        switch (type) {
        case 'deg':
            return parseInt(value * 100, 10) / 100;
            break;
        case 'url':
            var id = this.model.id;
            return _.map(value, function(layer) {
                return layer + '1.0.0/' + id + '/{z}/{x}/{y}';
            });
            break;
        case 'download':
            return value + 'download/' + this.model.id + '.mbtiles';
            break;
        case 'size':
            return (Math.ceil(parseInt(value) / 1048576)) + ' MB';
            break;
        }
    },
    render: function() {
        $(this.el).html(this.template('Map', {
            basepath: this.options.basepath,
            features: Bones.settings.features,
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
            url: this.format('url', this.model.layerURL()),
            download: this.format('download', this.model.layerURL()[0]),
            size: this.format('size', this.model.get('size'))
        }));
        this.map = new Bones.views.MapClient({model: this.model});
        this.bind('ready', this.map.ready);
        $(this.el).append(this.map.el);
        return this;
    }
});

// Maps
// ----
// View showing each map as a thumbnail. Main map browsing page.
Bones.views.Maps = Bones.views.HUD.extend({
    initialize: function(options) {
        Bones.views.HUD.prototype.initialize.call(this, options);
        _.bindAll(this, 'render');
        this.render().trigger('attach');
    },
    render: function() {
        $(this.el).html(this.template('Maps', this.options));
        var that = this;
        this.collection.each(function(tileset) {
            tileset.view = new Bones.views.MapThumb({ model: tileset });
            $('ul.maps', that.el).append(tileset.view.el);
        });
        return this;
    }
});

// MapThumb
// --------
// Thumbnail view of a single map.
Bones.views.MapThumb = Backbone.View.extend({
    tagName: 'li',
    className: 'clearfix',
    initialize: function(options) {
        this.render().trigger('attach');
    },
    render: function() {
        $(this.el).html(this.template('MapThumb', {
            basepath: this.options.basepath,
            id: this.model.get('id'),
            name: this.model.get('name'),
            thumb: this.model.thumb()
        }));
        return this;
    }
});

(typeof module !== 'undefined') && (module.exports = Bones.views);


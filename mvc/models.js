// Backbone Models and Collections to be used both client/server side.
// Note that these models are read-only - no `PUT/POST/DELETE` expected.

// Requires for the server-side context. *TODO* Note that `var` is omitted here
// because even within the `if()` IE will wipe globally defined variables if
// `var` is included, leaving us with broken objects.
if (typeof require !== 'undefined') {
    _ = require('underscore')._,
    Backbone = require('backbone.js'),
    Bones = require('bones');
}

var Bones = Bones || {};
Bones.models = Bones.models || {};

// Tileset
// ---
// A single tileset, corresponding to an `.mbtiles` file. `model.id` is the
// file basename, e.g. `foo.mbtiles` has an `id` of `foo`.
Bones.models.Tileset = Backbone.Model.extend({
    initialize: function(attributes) {
        Backbone.Model.prototype.initialize.call(this, attributes);
        // Convert representation of baselayer into a true Tileset model.
        if (typeof this.get('baselayer') !== 'undefined') {
            this.set({ baselayer: new Tileset(this.get('baselayer')) });
        }
    },
    parse: function(response){
        var model = Backbone.Model.prototype.parse.call(this, response);
        // Convert representation of baselayer into a true Tileset model.
        if (typeof model.baselayer !== 'undefined') {
            model.baselayer = new Tileset(model.baselayer);
        }
        return model;
    },
    url: function() {
        return '/api/Tileset/' + this.id;
    },
    // Return the base URLs of TileStream tile servers including a single
    // trailing slash, e.g. http://localhost:8889/ in an Array.
    layerURL: function() {
        // Servers defined in `Bones.settings`.
        if (Bones.settings.tileHost.length) {
            return Bones.settings.tileHost;
        // Autodetect server from window object.
        } else if (window.location && window.location.hostname) {
            // Attempt to autodetect URL.
            var baseURL = window.location.protocol + '//' + window.location.hostname + ':' + Bones.settings.tilePort;
            var args = window.location.pathname.split('/');
            // Path already ends with trailing slash.
            if (args[args.length - 1] === '') {
                return [baseURL + args.join('/')];
            // index.html or similar trailing filename.
            } else if (args[args.length - 1].indexOf('.') !== -1) {
                args.pop();
                return [baseURL + args.join('/') + '/'];
            // Path beyond domain.
            } else {
                return [baseURL + args.join('/') + '/'];
            }
        // Server side, *TODO* needs a solution.
        } else {
            return ['http://localhost:8888/'];
        }
    },
    // Get the "mid" zoom level of this tileset. Useful for thumbnails/overview
    // images for tilesets.
    thumbzoom: function() {
        var range = this.get('maxzoom') - this.get('minzoom');
        if (range <= 1) {
            return this.get('maxzoom');
        } else {
            return Math.floor(range * 0.5) + this.get('minzoom');
        }
    },
    // Get ZXY of tile of tileset's center and minzoom. From [OSM wiki][1].
    // [1]: http://wiki.openstreetmap.org/wiki/Slippy_map_tilenames#lon.2Flat_to_tile_numbers_2
    toZXY: function() {
        var center = this.get('center');
        var z = this.thumbzoom();
        var lat_rad = center.lat * Math.PI / 180 * -1; // -1 for TMS (flipped from OSM)
        var x = parseInt((center.lon + 180.0) / 360.0 * Math.pow(2, z));
        var y = parseInt((1.0 - Math.log(Math.tan(lat_rad) + (1 / Math.cos(lat_rad))) / Math.PI) / 2.0 * Math.pow(2, z));
        return [z, x, y];
    },
    thumb: function(zxy) {
        zxy = zxy || this.toZXY();
        return this.layerURL()[0] + ['1.0.0', this.get('id'), zxy[0], zxy[1], zxy[2]].join('/') + '.png';
    },
    wax: function() {
        return {
            layers: [this.get('id')],
            center: [
                this.get('center').lon,
                this.get('center').lat,
                this.thumbzoom()
            ]
        };
    }
});

// Tilesets
// --------
// Collection of all tileset models.
Bones.models.Tilesets = Backbone.Collection.extend({
    model: Bones.models.Tileset,
    url: '/api/Tileset',
    comparator: function(model) {
        return (model.get('name') || model.get('id')).toLowerCase();
    }
});

(typeof module !== 'undefined') && (module.exports = Bones.models);


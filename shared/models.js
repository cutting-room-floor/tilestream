// Backbone Models and Collections to be used both client/server side.
// Note that these models are read-only - no `PUT/POST/DELETE` expected.

// Requires for the server-side context. *TODO* Note that `var` is omitted here
// because even within the `if()` IE will wipe globally defined variables if
// `var` is included, leaving us with broken objects.
if (typeof require !== 'undefined') {
    Settings = require('settings'),
    Backbone = require('backbone-server.js'),
    _ = require('underscore')._;
}

// Tileset
// ---
// A single tileset, corresponding to an `.mbtiles` file. `model.id` is the
// file basename, e.g. `foo.mbtiles` has an `id` of `foo`.
var Tileset = Backbone.Model.extend({
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
        return '/api/tileset/' + this.id;
    },
    // Return the base URLs of TileStream tile servers including a single
    // trailing slash, e.g. http://localhost:8889/ or http://mapbox/tilestream/
    // in an Array.
    layerURL: function() {
        // Servers defined in `settings.js`.
        if (Settings.tile_hostnames.length) {
            return Settings.tile_hostnames;
        // Autodetect server from window object.
        } else if (window.location && window.location.hostname) {
            // Attempt to autodetect URL.
            var baseURL = window.location.protocol + '//' + window.location.hostname + ':' + Settings.port;
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
            return ['http://localhost:9000/'];
        }
    },
    // Get ZXY of tile of tileset's center and minzoom. From [OSM wiki][1].
    // [1]: http://wiki.openstreetmap.org/wiki/Slippy_map_tilenames#lon.2Flat_to_tile_numbers_2
    toZXY: function() {
        var center = this.get('center');
        center.lat = -1 * center.lat; // TMS is flipped from OSM calc below.
        var z = this.get('minzoom');
        var lat_rad = center.lat * Math.PI / 180;
        var x = parseInt((center.lon + 180.0) / 360.0 * Math.pow(2, z));
        var y = parseInt((1.0 - Math.log(Math.tan(lat_rad) + (1 / Math.cos(lat_rad))) / Math.PI) / 2.0 * Math.pow(2, z));

        return [z, x, y];
    },
    thumb: function(zxy) {
        return this.layerURL()[0] + ['1.0.0', this.get('id'), zxy[0], zxy[1], zxy[2]].join('/') + '.png';
    }
});

// TilesetList
// -------
// Collection of all tileset models.
var TilesetList = Backbone.Collection.extend({
    model: Tileset,
    url: '/api/tileset'
});

if (typeof module !== 'undefined') {
    module.exports = {
        Tileset: Tileset,
        TilesetList: TilesetList
    };
}

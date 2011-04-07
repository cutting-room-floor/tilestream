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
    initialize: function(attributes, options) {
        options = options || {};
        if (this.collection) {
            this.uiHost = this.collection.uiHost;
            this.tileHost = this.collection.tileHost;
        } else {
            this.uiHost = options.uiHost;
            this.tileHost = options.tileHost;
        }
    },
    url: function() {
        return '/api/Tileset/' + this.id;
    },
    layerURL: function() {
        return this.tileHost;
    },
    // Get ZXY of tile of tileset's center and minzoom. From [OSM wiki][1].
    // [1]: http://wiki.openstreetmap.org/wiki/Slippy_map_tilenames#lon.2Flat_to_tile_numbers_2
    toZXY: function() {
        var z = this.get('center')[2];
        var lat_rad = this.get('center')[1] * Math.PI / 180 * -1; // -1 for TMS (flipped from OSM)
        var x = parseInt((this.get('center')[0] + 180.0) / 360.0 * Math.pow(2, z));
        var y = parseInt((1.0 - Math.log(Math.tan(lat_rad) + (1 / Math.cos(lat_rad))) / Math.PI) / 2.0 * Math.pow(2, z));
        return [z, x, y];
    },
    thumb: function(zxy) {
        zxy = zxy || this.toZXY();
        return this.layerURL()[0] + ['1.0.0', this.get('id'), zxy[0], zxy[1], zxy[2]].join('/') + '.png';
    },
    wax: function() {
        return {
            api: 'ol',
            layers: [this.get('id')],
            center: this.get('center')
        };
    },
    // Pass through function for determining the server-side filepath of a
    // Tileset model.
    filepath: function(path) {
        return path + '/' + this.id + '.mbtiles';
    }
});

// Tilesets
// --------
// Collection of all tileset models.
Bones.models.Tilesets = Backbone.Collection.extend({
    initialize: function(models, options) {
        options = options || {};
        this.uiHost = options.uiHost;
        this.tileHost = options.tileHost;
    },
    model: Bones.models.Tileset,
    url: '/api/Tileset',
    comparator: function(model) {
        return (model.get('name') || model.get('id')).toLowerCase();
    },
    // Pass through function for determining the server-side filepath of a
    // Tilesets collection.
    filepath: function(path) {
        return path;
    }
});

(typeof module !== 'undefined') && (module.exports = Bones.models);


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

// Map
// ---
// A single map, corresponding to an `.mbtiles` file. `model.id` is the
// file basename, e.g. `foo.mbtiles` has an `id` of `foo`.
var Map = Backbone.Model.extend({
    url: function() {
        return '/api/map/' + this.id;
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
    }
});

// MapList
// -------
// Collection of all map models.
var MapList = Backbone.Collection.extend({
    model: Map,
    url: '/api/map'
});

if (typeof module !== 'undefined') {
    module.exports = {
        Map: Map,
        MapList: MapList
    };
}

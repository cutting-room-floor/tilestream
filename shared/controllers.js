// UI router for TileStream. The `Router` controller will handle routing for
// the client-side UI as well as server-side renders for search crawlers.
// Routes are registered with both a "normal" path as well as the "hashbang"
// path for supporting [Google's AJAX crawling][1] recommendation.
//
// [1]: http://code.google.com/web/ajaxcrawling/docs/getting-started.html

// Requires for the server-side context. *TODO* Note that `var` is omitted here
// because even within the `if()` IE will wipe globally defined variables if
// `var` is included, leaving us with broken objects.
if (typeof require !== 'undefined') {
    Backbone = require('backbone-server.js'),
    _ = require('underscore')._;
    Map = require('models-server').Map;
    MapList = require('models-server').MapList;
    PageView = require('views-server').PageView;
    ErrorView = require('views-server').ErrorView;
    MapView = require('views-server').MapView;
    MapListView = require('views-server').MapListView;
}

var Router = Backbone.Controller.extend({
    initialize: function(options) {
        _.bindAll(this, 'list', 'map');
        Backbone.Controller.prototype.initialize.call(this, options);
    },
    routes: {
        '/': 'list',
        '!/': 'list',
        '/map/:id': 'map',
        '!/map/:id': 'map'
    },
    list: function(res) {
        var that = this;
        (new MapList()).fetch({
            success: function(collection) {
                var view = new MapListView({ collection: collection });
                new PageView({ view: view, res: res });
            },
            error: function() {
                var view = new ErrorView({ message: 'Error loading maps.' });
                new PageView({ view: view, res: res });
            }
        });
    },
    map: function(id, res) {
        var that = this;
        (new Map({ id: id })).fetch({
            success: function(model) {
                var view = new MapView({ model: model });
                new PageView({ view: view, res: res });
            },
            error: function() {
                var view = new ErrorView({ message: 'Map not found.' });
                new PageView({ view: view, res: res });
            }
        });
    }
});

if (typeof module !== 'undefined') {
    module.exports = {
        Router: Router
    };
}

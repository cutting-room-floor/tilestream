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
    _ = require('underscore')._,
    Backbone = require('backbone.js'),
    Tileset = require('models').Tileset,
    TilesetList = require('models').TilesetList,
    PageView = require('views').PageView,
    ErrorView = require('views').ErrorView,
    TilesetView = require('views').TilesetView,
    TilesetListView = require('views').TilesetListView;
}

var Router = Backbone.Controller.extend({
    initialize: function(options) {
        _.bindAll(this, 'list', 'tileset');
        Backbone.Controller.prototype.initialize.call(this, options);
    },
    routes: {
        '/': 'list',
        '!/': 'list',
        '/tileset/:id': 'tileset',
        '!/tileset/:id': 'tileset'
    },
    list: function(response) {
        var that = this;
        (new TilesetList()).fetch({
            success: function(collection) {
                var view = new TilesetListView({ collection: collection });
                response(new PageView({ view: view }));
            },
            error: function() {
                var view = new ErrorView({ message: 'Error loading tilesets.' });
                response(new PageView({ view: view }));
            }
        });
    },
    tileset: function(id, response) {
        var that = this;
        (new Tileset({ id: id })).fetch({
            success: function(model) {
                var view = new TilesetView({ model: model });
                response(new PageView({ view: view }));
            },
            error: function() {
                var view = new ErrorView({ message: 'Tileset not found.' });
                response(new PageView({ view: view }));
            }
        });
    }
});

if (typeof module !== 'undefined') {
    module.exports = {
        Router: Router
    };
}

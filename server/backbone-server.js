// Backbone base class overrides for the server-side context. DOM-related
// modules are required *globally* such that Backbone will pick up their
// presence.
$ = require('jquery-1.4.4');
jQuery = require('jquery-1.4.4');
jsdom  = require('jsdom').jsdom;
window = jsdom().createWindow();
document = window.document;

var _ = require('underscore')._,
    Backbone = require('../modules/backbone/backbone.js'),
    Handlebars = require('handlebars'),
    Templates = require('templates')();

// View (server-side)
// ------------------
// With a server-side DOM present Backbone Views tend to take care of
// themselves. The main override is to clear out `delegateEvents()` - the
// `events` hash is of no use on the server-side with the View being dead
// after initial delivery. `template()` and `html()` serve as 
// functions to make client/server-side templating a uniform interface.
//
// See `shared/views.js` for a full list of conventions expected to be used
// by Views to be client/server compatible.
Backbone.View = Backbone.View.extend({
    delegateEvents: function() {},
    template: function(data) {
        if (!this.templateName) return '';
        var template = Handlebars.compile(Templates[this.templateName]);
        return template(data);
    },
    html: function() {
        return $(this.el).html();
    }
});

// Controller/History (server-side)
// --------------------------------
// We expose Backbone's controller/history routing functionality to Connect
// as a middleware. A Connect server can add Backbone controller routing to
// its stack of middlewares by doing:
//
//     new MyController(); /* Must be called first to bind routes */
//     server.use(Backbone.history.middleware());

// Override `.route()` to add a callback handler with an additional `res`
// argument to allow the Connect response object to be passed through.
Backbone.Controller.prototype.route = function(route, name, callback) {
    Backbone.history || (Backbone.history = new Backbone.History);
    if (!_.isRegExp(route)) route = this._routeToRegExp(route);
    Backbone.history.route(route, _.bind(function(fragment, res) {
        var args = this._extractParameters(route, fragment);
        callback.apply(this, args.concat([res]));
        this.trigger.apply(this, ['route:' + name].concat(args));
    }, this));
};

// Override `.loadUrl()` to allow `res` response object to be passed through
// to handler callback.
Backbone.History.prototype.loadUrl = function(fragment, res) {
    var matched = _.any(this.handlers, function(handler) {
        if (handler.route.test(fragment)) {
            handler.callback(fragment, res);
            return true;
        }
    });
    return matched;
};

// Provide a custom Backbone.History middleware for use with Connect.
Backbone.History.prototype.middleware = function() {
    var that = this;
    return function(req, res, next) {
        var fragment;
        if (req.query && req.query['_escaped_fragment_']) {
            fragment = req.query['_escaped_fragment_'];
        } else {
            fragment = req.url;
        }
        !that.loadUrl(fragment, res) && next();
    };
};

// Clear out unused/unusable methods.
Backbone.History.prototype.start = function() {};
Backbone.History.prototype.getFragment = function() {};
Backbone.History.prototype.saveLocation = function() {};

module.exports = Backbone;

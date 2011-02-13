$(function() {
    // Fix for [IE8 AJAX payload caching][1].
    // [1]: http://stackoverflow.com/questions/1013637/unexpected-caching-of-ajax-results-in-ie8
    $.ajaxSetup({ cache: false });

    // Redirect requests without the hashbang.
    if (typeof location.href.split('#')[1] === 'undefined') {
        window.location = '/#!' + window.location.pathname;
    }
    new Router();
    Backbone.history.start();
});

// Client-side `Backbone.View` overrides. Adds an `attach()` method that can be
// triggered after `render()` to allow client-side specific JS event handlers,
// UI libraries to be attached or inited. `template()` and `html()` are mirrors
// of their server-side counterparts for templating and easy generation of a
// View's HTML contents.
Backbone.View = Backbone.View.extend({
    attach: function() {},
    initialize: function(options) {
        _.bindAll(this, 'attach');
        this.bind('attach', this.attach);
    },
    template: function(data) {
        if (!this.templateName) return '';
        var template = Handlebars.compile(Templates[this.templateName]);
        return template(data);
    },
    html: function() {
        return $(this.el).html();
    }
});

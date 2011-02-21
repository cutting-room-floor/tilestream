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


$(function() {
    // Fix for [IE8 AJAX payload caching][1].
    // [1]: http://stackoverflow.com/questions/1013637/unexpected-caching-of-ajax-results-in-ie8
    $.ajaxSetup({ cache: false });

    new Router();
    Backbone.history.start();
});


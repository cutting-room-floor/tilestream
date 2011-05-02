var initialize = commands.start.prototype.initialize;

command = commands.start.extend({
    initialize: function(options) {
        require('../lib/bootstrap')(options.config);
        return initialize.call(this, options);
    }
});


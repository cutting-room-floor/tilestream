commands.start.augment({
    initialize: function(parent, options) {
        require('../lib/bootstrap')(options.config);
        return parent.call(this, options);
    }
})
router = Bones.Router.extend({
    initialize: function(options) {
        if (!options.plugin.config.syslog) return;

        var logger = require('syslog').createClient(514, 'localhost', { name: 'tilestream' });
        this.server.error(function(err, req, res, next) {
            err.method = req.method;
            err.url = req.url;
            err.headers = req.headers;
            logger.error(JSON.stringify(err));
            next();
        });
    }
});


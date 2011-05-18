servers['Core'].augment({
    initialize: function(parent, app) {
        this.use(new servers['Host'](app));

        parent.call(this, app);

        this.use(new servers['Wax'](app));
        if (app.config.tilePort === app.config.uiPort) {
            this.use(new servers['Tile'](app));
        }
        this.enable('jsonp callback');
        this.port = app.config.uiPort;
    },
    conclude: function(parent, app) {
        if (app.config.syslog) {
            var logger = require('syslog').createClient(514, 'localhost', { name: 'tilestream' });
            this.error(function(err, req, res, next) {
                err.method = req.method;
                err.url = req.url;
                err.headers = req.headers;
                logger.error(JSON.stringify(err));
                next(err);
            });
        }
        parent.call(this, app);
    }
});

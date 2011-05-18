// Middleware, retrieves host information from request headers and passes them
// to the rest of the stack at `req.uiHost` and `req.tileHost`.
server = Bones.Server.extend({
    initialize: function(app) {
        this.config = app.config;
        this.use(_(this.middleware).bind(this));
    },
    removeTileSubdomain: function(host) {
        // If subdomain already exists on the request host, remove it.
        if (this.config.subdomains) {
            var subdomains = this.config.subdomains.split(',');
            var hostComponents = host.split('.');
            if (_.include(subdomains, hostComponents.shift())) {
               return hostComponents.join('.');
            }
        }
        return host;
    },
    middleware: function(req, res, next) {
        req.query.basepath = req.query.basepath || '/';
        if (req.headers && req.headers.host && !req.query.uiHost) {
            req.query.uiHost = 'http://' + req.headers.host + '/';
            if (this.config.subdomains) {
                // Add subdomains for tiles.
                var basehost = this.removeTileSubdomain(req.headers.host);
                var subdomains = this.config.subdomains.split(',');
                req.query.tileHost = [];
                _.each(subdomains, function(subdomain) {
                    req.query.tileHost.push('http://' + subdomain + '.' + basehost + '/');
                });
            } else {
                // Use the same host for UI and tiles.
                req.query.tileHost = ['http://' + req.headers.host + '/'];
            }
        }
        next();
    }
});


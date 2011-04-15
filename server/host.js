var _ = require('underscore')._;

// Middleware, retrieves host information from request headers and passes them
// to the rest of the stack at `req.uiHost` and `req.tileHost`.
module.exports = function(settings) {
    var host = {
        removeTileSubdomain: function(host) {
            // If subdomain already exists on the request host, remove it.
            if (settings.subdomains) {
                var subdomains = settings.subdomains.split(',');
                var hostComponents = host.split('.');
                if (_.include(subdomains, hostComponents.shift())) {
                   return hostComponents.join('.');
                }
            }
            return host;
        },
        middleware: _(function(req, res, next) {
            if (req.headers && req.headers.host && !req.uiHost) {
                req.uiHost = 'http://' + req.headers.host + '/';
                if (settings.subdomains) {
                    // Add subdomains for tiles.
                    var basehost = host.removeTileSubdomain(req.headers.host);
                    var subdomains = settings.subdomains.split(',');
                    req.tileHost = [];
                    _.each(subdomains, function(subdomain) {
                        req.tileHost.push('http://' + subdomain + '.' + basehost + '/');
                    });
                } else {
                    // Use the same host for UI and tiles.
                    req.tileHost = ['http://' + req.headers.host + '/'];
                }
                req.model = req.model || {};
                req.model.options = req.model.options || {};
                req.model.options.uiHost = req.uiHost;
                req.model.options.tileHost = req.tileHost;
                req.model.options.basepath = '/';
            }
            next();
        }).bind(this)
    };
    return host;
};


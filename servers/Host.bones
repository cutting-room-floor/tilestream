server = Bones.Server.extend({});

server.prototype.initialize = function(app) {
    this.config = app.config;
    this.use(this.hostInfo.bind(this));
};

// Middleware, retrieves host information from request headers and passes them
// to the rest of the stack at `req.uiHost` and `req.tileHost`.
server.prototype.removeTileSubdomain = function(host) {
    // If subdomain already exists on the request host, remove it.
    if (this.config.subdomains) {
        var subdomains = this.config.subdomains.split(',');
        var hostComponents = host.split('.');
        if (_.include(subdomains, hostComponents.shift())) {
           return hostComponents.join('.');
        }
    }
    return host;
};

server.prototype.hostInfo = function(req, res, next) {
    req.query.basepath = req.query.basepath || '/';
    if (!req.headers.host) {
        var address = req.socket.address();
        req.headers.host = address.address + ':' + address.port;
        var subdomains = false;
    } else {
        var subdomains = this.config.subdomains;
    }

    if (req.headers && req.headers.host && !req.query.uiHost) {
        req.query.uiHost = 'http://' + req.headers.host;
        if (subdomains) {
            // Add subdomains for tiles.
            var basehost = this.removeTileSubdomain(req.headers.host);
            var subdomains = this.config.subdomains.split(',');
            req.query.tileHost = [];
            _.each(subdomains, function(subdomain) {
                req.query.tileHost.push('http://' + subdomain + '.' + basehost);
            });
        } else {
            // Use the same host for UI and tiles.
            req.query.tileHost = [ 'http://' + req.headers.host ];
        }
    }
    next();
};


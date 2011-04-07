// Middleware, retrieves host information from request headers and passes them
// to the rest of the stack at `req.uiHost` and `req.tileHost`.
module.exports = function(settings) {
    return function(req, res, next) {
        if (req.headers && req.headers.host && !req.uiHost) {
            req.uiHost = 'http://' + req.headers.host + '/';
            req.tileHost = ['http://' + req.headers.host + '/'];
            req.model = req.model || {};
            req.model.options = req.model.options || {};
            req.model.options.uiHost = req.uiHost;
            req.model.options.tileHost = req.tileHost;
        }
        next();
    };
};


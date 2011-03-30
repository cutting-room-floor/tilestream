var util = require('util');

// Application bootstrap. Ensures that tiles directory exists at server start.
module.exports = function(settings) {
    var fs = require('fs');
    try {
        fs.statSync(settings.tiles);
    } catch (Exception) {
        console.log('Creating tiles dir %s', settings.tiles);
        fs.mkdirSync(settings.tiles, 0777);
    }
};

Error.HTTP = function(msg, code) {
    this.message = msg;
    this.code = code || 500;
    Error.captureStackTrace(this, arguments.callee);
};
Error.HTTP.prototype.__proto__ = Error.prototype;

Error.HTTP.handler = function(env) {
    return function(err, req, res, next){
        if (err instanceof Error.HTTP) {
            // Dump to console.
            util.error(err.stack);

            var accept = req.headers.accept || '';
            if (accept.indexOf('json') !== -1) {
                var json =
                res.writeHead(err.code, { 'Content-Type': 'application/json' });
                if (env.adminParty) {
                    res.end(JSON.stringify({ error: err }));
                } else {
                    res.end(JSON.stringify({ error: err.message, code: err.code }));
                }
            } else {
                res.writeHead(err.code, { 'Content-Type': 'text/plain' });
                if (env.adminParty) {
                    res.end(err.stack);
                } else {
                    res.end(err.message);
                }
            }
        } else {
            next(err);
        }
    };
};


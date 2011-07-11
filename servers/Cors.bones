server = Bones.Server.extend({});

server.prototype.initialize = function(app) {
    this.use(this.allow.bind(this));
};

server.prototype.allow = function(req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET');
    next();
};


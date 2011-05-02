var tileset = require('../lib/tileset');

// Server-side sync method for Tileset model.
var register = models.Tileset.register;
models.Tileset.register = function(server) {
    var config = server.plugin.config;
    this.prototype.sync = function(method, model, success, error) {
        switch (method) {
        case 'read':
            tileset.load(model.filepath(config.tiles), function(err, data) {
                return err ? error(err) : success(data);
            });
            break;
        }
    };
    return register.apply(this, arguments);
};

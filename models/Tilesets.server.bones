var tilelive = require('tilelive');

// Server-side sync method for Tileset model.
models.Tilesets.prototype.sync = function(method, model, success, error) {
    switch (method) {
    case 'read':
        tilelive.all(Bones.plugin.config.tiles, function(err, data) {
            if (err) return error(err);
            _(data).each(function(tileset) {
                tileset.host = _(model.options.tileHost).map(function(host) {
                    return host + model.options.basepath;
                });
            });
            return success(data);
        });
        break;
    }
};

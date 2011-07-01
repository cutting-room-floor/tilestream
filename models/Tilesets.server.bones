var tilelive = require('tilelive');

// Server-side sync method for Tileset model.
models.Tilesets.prototype.sync = function(method, model, success, error) {
    switch (method) {
    case 'read':
        tilelive.all(Bones.plugin.config.tiles, function(err, data) {
            if (err) return error(err);
            data = _(data).map(function(tileset) {
                return models.Tileset.syncread(tileset, model.options);
            });
            return success(data);
        });
        break;
    }
};

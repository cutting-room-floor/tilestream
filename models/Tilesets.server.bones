var tilelive = require('tilelive');

// Server-side sync method for Tileset model.
models.Tilesets.prototype.sync = function(method, model, success, error) {
    switch (method) {
    case 'read':
        tilelive.all(model.filepath(Bones.plugin.config.tiles), function(err, data) {
            if (err) return error(err);
            _(data).each(function(t) {
                t.host = model.options.tileHost;
            });
            return success(data);
        });
        break;
    }
};

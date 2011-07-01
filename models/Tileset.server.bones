var tileset = require('../lib/tileset');

// Server-side sync method for Tileset model.
models.Tileset.prototype.sync = function(method, model, success, error) {
    switch (method) {
    case 'read':
        tileset.load(model.filepath(Bones.plugin.config.tiles), function(err, data) {
            if (err) return error(err);
            data.host = _(model.options.tileHost).map(function(host) {
                return host + model.options.basepath;
            });
            success(data);
        });
        break;
    }
};

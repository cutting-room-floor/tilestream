var tilelive = require('tilelive');

// Server-side sync method for Tileset model.
models.Tileset.prototype.sync = function(method, model, success, error) {
    switch (method) {
    case 'read':
        var uri = model.options.uri;
        if (!uri) uri = Bones.plugin.config.tiles + '?id=' + model.get('id');

        tilelive.info(uri, function(err, data, source) {
            if (err) return error(err);
            data.host = model.options.tileHost;
            model.source = source;
            success(data);
        });
        break;
    }
};

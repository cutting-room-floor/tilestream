var tilelive = require('tilelive');

// Server-side sync method for Tileset model.
models.Tileset.prototype.sync = function(method, model, success, error) {
    switch (method) {
    case 'read':
        var uri = model.options.uri;
        if (!uri) uri = Bones.plugin.config.tiles + '?id=' + model.get('id');

        tilelive.info(uri, function(err, data, source) {
            if (err) return error(err);
            data.host = _(model.options.tileHost).map(function(host) {
                return host + model.options.basepath;
            });
            model.source = source;
            success(data);
        });
        break;
    }
};

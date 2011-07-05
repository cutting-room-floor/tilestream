var tileset = require('../lib/tileset');

// Server-side sync method for Tileset model.
models.Tilesets.prototype.sync = function(method, model, success, error) {
    if (method !== 'read') return error(new Error('Unsupported method.'));

    var filepath = model.filepath(Bones.plugin.config.tiles);
    tileset.all(filepath, function(err, data) {
        if (err) return error(err);
        data = _(data).map(function(tileset) {
            return models.Tileset.syncread(tileset, model.options);
        });
        return success(data);
    });
};

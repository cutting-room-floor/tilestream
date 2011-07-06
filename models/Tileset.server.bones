var tileset = require('../lib/tileset');

models.Tileset.syncread = function(data, options) {
    data.scheme = 'tms';
    data.download = options.tileHost[0] + options.basepath + 'download/' + data.basename;
    data.host = _(options.tileHost).map(function(host) {
        return host + options.basepath;
    });
    data.tiles = _(options.tileHost).map(function(host) {
        return host + options.basepath + '1.0.0/' + data.id + '/{z}/{x}/{y}.png';
    });
    if (data.formatter) data.grids = _(options.tileHost).map(function(host) {
        return host + options.basepath + '1.0.0/' + data.id + '/{z}/{x}/{y}.grid.json';
    });
    return data;
};

// Server-side sync method for Tileset model.
models.Tileset.prototype.sync = function(method, model, success, error) {
    switch (method) {
    case 'read':
        tileset.load(model.filepath(Bones.plugin.config.tiles), function(err, data) {
            if (err) return error(err);
            data = models.Tileset.syncread(data, model.options);
            success(data);
        });
        break;
    }
};

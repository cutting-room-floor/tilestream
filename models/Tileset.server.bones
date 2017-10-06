var tilelive = require('tilelive');
var url = require('url');

models.Tileset.syncread = function(data, options) {
    data.scheme = 'xyz';
    data.center = data.center || [0, 0, 0];
    data.tiles = data.tiles || _(options.tileHost).map(function(host) {
        return url.format({
            host: host,
            pathname: options.basepath + 'v2/' + data.id + '/{z}/{x}/{y}.png'
        });
    });
    if (data.formatter || data.template) {
        data.grids = data.grids || _(options.tileHost).map(function(host) {
            return url.format({
                host: host,
                pathname: options.basepath + 'v2/' + data.id + '/{z}/{x}/{y}.grid.json'
            });
        });
    }
    if (data.basename) data.download = url.format({
        host: options.tileHost[0],
        pathname: options.basepath + 'v2/' + data.basename
    });
    return data;
};

// Server-side sync method for Tileset model.
models.Tileset.prototype.sync = function(method, model, success, error) {
    switch (method) {
    case 'read':
        var uri = model.options.uri;
        if (!uri) uri = Bones.plugin.config.tiles + model.options.basepath + '?id=' + model.get('id');
        // Workaround https://github.com/mapbox/tilelive.js/issues/40
        if (process.platform === 'win32' && typeof uri === 'string') {
            uri = url.parse(uri, true);
            if (uri.protocol && uri.protocol.length <= 2) {
                uri.protocol = null;
            }
        }
        tilelive.info(uri, function(err, data, source) {
            var err = err || tilelive.verify(data, source);
            if (err) return error(err);
            data = models.Tileset.syncread(data, model.options);
            model.source = source;
            success(data);
        });
        break;
    }
};

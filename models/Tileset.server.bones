var tilelive = require('tilelive');
var url = require('url');

models.Tileset.syncread = function(data, options) {
    data.host = _(options.tileHost).map(function(host) {
        return url.format({
            host: host,
            pathname: options.basepath,
            protocol: 'http:'
        });
    });
    data.scheme = data.scheme || 'tms';
    data.tiles = data.tiles || _(options.tileHost).map(function(host) {
        return url.format({
            host: host,
            pathname: options.basepath + '1.0.0/' + data.id + '/${z}/${x}/${y}.png',
            protocol: 'http:'
        });
    });
    if (data.formatter) data.grids = data.grids || _(options.tileHost).map(function(host) {
        return url.format({
            host: host,
            pathname: options.basepath + '1.0.0/' + data.id + '/${z}/${x}/${y}.grid.json',
            protocol: 'http:'
        });
    });
    if (data.basename) data.download = url.format({
        host: options.tileHost[0],
        pathname: options.basepath + 'download/' + data.basename,
        protocol: 'http:'
    });
    return data;
};

// Retrieve `baseUrl`, `layerName`, and `extension` properties from a
// `tiles` array to support legacy mapping APIs that don't support
// tilejson token URLs.
models.Tileset.legacy = function(urls) {
    var legacy = {};
    legacy.baseUrl = _(urls).chain()
        .map(function(url) {
            // Matches x.0.0/[layerName]/${z}/{$x}/{$y}.[extension]
            var match = url.match(/\d\.0\.0\/([^\/]+)\/\${\w}\/\${\w}\/\${\w}.(\w+)$/);
            if (!match) return;
            legacy.layerName = match[1];
            legacy.extension = match[2];
            return url.substr(0, match.index);
        })
        .compact()
        .value();
    return legacy;
};

// Server-side sync method for Tileset model.
models.Tileset.prototype.sync = function(method, model, success, error) {
    switch (method) {
    case 'read':
        var uri = model.options.uri;
        if (!uri) uri = Bones.plugin.config.tiles + model.options.basepath + '?id=' + model.get('id');

        tilelive.info(uri, function(err, data, source) {
            if (err) return error(err);
            data = models.Tileset.syncread(data, model.options);
            model.source = source;
            success(data);
        });
        break;
    }
};

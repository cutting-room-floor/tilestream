var path = require('path');

Bones.Command.options['uiPort'] = {
    'title': 'uiPort=[port]',
    'description': 'UI server port.',
    'default': 8888
};

Bones.Command.options['tilePort'] = {
    'title': 'tilePort=[port]',
    'description': 'Tile server port.',
    'default': 8888
};

Bones.Command.options['tileHost'] = {
    'title': 'tileHost=[host]',
    'description': 'Tile hostname',
    'default': 'req.headers.host'
};

Bones.Command.options['subdomains'] = {
    'title': 'subdomains=[list]',
    'description': 'Comma separated list of subdomains to use for tiles.'
};

Bones.Command.options['tiles'] = {
    'title': 'tiles=[path]',
    'description': 'Path to tiles directory.',
    'default': path.join(process.env.HOME, 'Documents', 'MapBox', 'tiles')
};

Bones.Command.options['accesslog'] = {
    'title': 'accesslog',
    'description': 'Print every request to stdout.',
    'default': false
};

Bones.Command.augment({
    bootstrap: function(parent, plugin, callback) {
        parent.call(this, plugin, function() {
            require('../lib/bootstrap')(plugin.config, callback);
        });
    }
});

var path = require('path');

var defaultTilePath;
if(process.env.HOME !== undefined) {
    defaultTilePath = path.join(process.env.HOME, 'Documents', 'MapBox', 'tiles');
} else {
    defaultTilePath = path.join(process.cwd(), 'tiles');
}

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
    'description': 'Tile hostname'
};

Bones.Command.options['subdomains'] = {
    'title': 'subdomains=[list]',
    'description': 'Comma separated list of subdomains to use for tiles.'
};

Bones.Command.options['tiles'] = {
    'title': 'tiles=[path]',
    'description': 'Path to tiles directory.',
    'default': defaultTilePath
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

// Bootstrap.
require('tilestream/server/bootstrap')(require('tilestream/settings'));

var _ = require('underscore'),
    express = require('express'),
    settings = require('tilestream/settings'),
    tile_server = express.createServer(),
    ui_server = settings.UIPort === settings.port ? tile_server : express.createServer(),
    mirror = require('mirror');

ui_server.use(express.staticProvider(__dirname + '/client'));
ui_server.enable('jsonp callback');
tile_server.enable('jsonp callback');

// Initialize bones, apply overrides/mixins and other setup.
require('bones').Bones(ui_server, {secret: ''});
require('tilestream/server/models-server');
require('tilestream/server/templates')(settings);

// Main server modules.
require('tilestream/server/tile-server')(tile_server, settings);
require('tilestream/server/ui-server')(ui_server, settings, '');
require('tilestream/server/wax')(ui_server, settings);

// Mirror module assets.
ui_server.get('/vendor.js', mirror.assets([
    'underscore/underscore.js',
    'backbone/backbone.js',
    'handlebars/handlebars.js',
    'bones/bones.js',
    'openlayers_slim/OpenLayers.js',
    'wax/control/lib/gridutil.js',
    'wax/build/wax.ol.min.js',
    'wax/lib/record.js',
    'tilestream/mvc/controllers.js',
    'tilestream/mvc/models.js',
    'tilestream/mvc/views.js'
]));

ui_server.get('/vendor.css', mirror.assets([
    'wax/theme/controls.css'
]));

ui_server.get('/theme/default/style.css', mirror.file('openlayers_slim/theme/default/style.css'))

if (tile_server.settings.env !== 'test') {
    tile_server.listen(settings.port);
    console.log('Started TileStream on port %d.', settings.port);

    if (settings.UIPort !== settings.port) {
        ui_server.listen(settings.UIPort);
        console.log('Started TileStream UI on port %d.', settings.UIPort);
    }
}

module.exports = {
    tile_server: tile_server,
    ui_server: ui_server
};

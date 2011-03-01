require.paths.splice(0, require.paths.length);
require.paths.unshift(
    __dirname + '/lib/node',
    __dirname + '/server',
    __dirname + '/mvc',
    __dirname
);

var _ = require('underscore'),
    express = require('express'),
    settings = require('settings'),
    tile_server = express.createServer(),
    ui_server = settings.UIPort === settings.port ? tile_server : express.createServer(),
    Bones = require('bones').Bones(ui_server);

// Apply overrides/mixins and other setup.
require('models-server');
require('templates')(settings);
require('bootstrap')(settings);

// Main server modules.
require('tile-server')(tile_server, settings);
require('ui-server')(ui_server, settings);
require('wax')(ui_server, settings);

tile_server.enable('jsonp callback');
ui_server.enable('jsonp callback');

ui_server.use(express.staticProvider('client'));
ui_server.use(express.staticProvider('mvc'));
ui_server.use(express.staticProvider('modules'));

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

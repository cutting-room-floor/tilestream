require.paths.splice(0, require.paths.length);
require.paths.unshift(
    __dirname + '/../lib/node',
    __dirname + '/../'
);

var assert = require('assert');
var servers = require('tilestream.js');
var settings = require('settings');

// Override settings for test environment.
settings.tiles = __dirname + '/fixtures';
settings.features = {
    'download': true,
    'info': true
};

module.exports = {
    'tile': function() {
        assert.response(
            servers.tile_server,
            { url: '/1.0.0/control_room/3/4/5.png' },
            { status: 200 },
            function(res) {
                assert.equal(res.headers['content-length'], 63554);
                assert.equal(res.headers['content-type'], 'image/png');
                assert.equal(res.headers['cache-control'], 'max-age=31536000');
                assert.ok(res.headers['last-modified']);
                assert.ok(res.headers['e-tag']);
            }
        );
    },
    'error tile': function() {
        assert.response(
            servers.tile_server,
            { url: '/1.0.0/control_room/-1/-1/-1.png' },
            { status: 404 },
            function(res) {
                assert.equal(res.headers['content-length'], 1454);
                assert.equal(res.headers['content-type'], 'image/png');
            }
        );
    },
    'mbtiles download': function() {
        assert.response(
            servers.tile_server,
            { url: '/download/control_room.mbtiles' },
            { status: 200 },
            function(res) {
                assert.equal(res.body.length, 2976208);
            }
        );
    },
    'load map': function() {
        assert.response(
            servers.ui_server,
            { url: '/api/Tileset/control_room' },
            { status: 200 },
            function(res) {
                var map;
                assert.doesNotThrow(function() {
                    map = JSON.parse(res.body);
                }, SyntaxError);
                assert.equal(map.id, 'control_room');
                assert.equal(map.type, 'baselayer');
                assert.equal(map.bounds, "-180,-85.05112877980659,180,89.99075251648905");
            }
        );
    },
    'load maps': function() {
        assert.response(
            servers.ui_server,
            { url: '/api/Tileset' },
            { status: 200 },
            function(res) {
                var maps;
                assert.doesNotThrow(function() {
                    maps = JSON.parse(res.body);
                }, SyntaxError);
                assert.equal(maps.length, 1);
                assert.equal(maps[0].id, 'control_room');
                assert.equal(maps[0].type, 'baselayer');
                assert.equal(maps[0].bounds, "-180,-85.05112877980659,180,89.99075251648905");
            }
        );
    },
    'ssviews list': function() {
        assert.response(
            servers.ui_server,
            { url: '/' },
            { status: 200 },
            function(res) {
                assert.ok(res.body.indexOf('<label>control_room</label>') >= 0, 'Map markup.');
            }
        );
    },
    'ssviews map': function() {
        assert.response(
            servers.ui_server,
            { url: '/tileset/control_room' },
            { status: 200 },
            function(res) {
                assert.ok(res.body.indexOf('<a href="#!/tileset/control_room">control_room</a>') >= 0, 'Map markup.');
            }
        );
        assert.response(
            servers.ui_server,
            { url: '/?_escaped_fragment_=/tileset/control_room' },
            { status: 200 },
            function(res) {
                assert.ok(res.body.indexOf('<a href="#!/tileset/control_room">control_room</a>') >= 0, 'Map markup.');
            }
        );
    },
    'settings': function() {
        assert.response(
            servers.ui_server,
            { url: '/settings.js' },
            { status: 200 }
        );
    },
    'wax endpoint': function() {
        assert.response(
            servers.ui_server,
            { url: '/wax.json?el=openlayers-map&layers%5B%5D=control_room&center%5B%5D=0&center%5B%5D=0&zoom=-1&callback=_jqjsp&_1298387967133=' },
            { status: 200 },
            function(res) {
                assert.doesNotThrow(function() {
                    var matches = res.body.match(/\_jqjsp\((.+)\);/);
                    JSON.parse(matches[1]);
                });
            }
        );
        assert.response(
            servers.ui_server,
            { url: '/wax.json?el=openlayers-map&center%5B%5D=0&center%5B%5D=0&zoom=-1&callback=_jqjsp&_1298387967133=' },
            { status: 400 }
        );
    }
}


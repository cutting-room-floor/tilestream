var _ = require('underscore');
var assert = require('assert');

// Load application.
require('..');
var tilestream = require('bones').plugin;
tilestream.config = {
    tiles: __dirname + '/fixtures/tiles',
    uiPort: 8888,
    tilePort: 8888,
    subdomains: 'a,b,c,d'
};
var command = tilestream.start();

var request = { headers: { 'host': 'localhost:8888' } };

exports['tile'] = function() {
    assert.response(
        command.servers['UI'].server,
        { url: '/1.0.0/control_room/3/4/5.png' },
        { status: 200 },
        function(res) {
            assert.equal(res.headers['content-length'], 63554);
            assert.equal(res.headers['content-type'], 'image/png');
            assert.equal(res.headers['cache-control'], 'max-age=3600');
            assert.ok(res.headers['last-modified']);
            assert.ok(res.headers['e-tag']);
        }
    );
};

exports['tile invalid name'] = function() {
    assert.response(
        command.servers['UI'].server,
        { url: '/1.0.0/bad.name/0/0/0.png' },
        { status: 404 }
    );
};

exports['error tile'] = function() {
    assert.response(
        command.servers['UI'].server,
        { url: '/1.0.0/control_room/-1/-1/-1.png' },
        { status: 404 }
    );
};

exports['grid tile'] = function() {
    assert.response(
        command.servers['UI'].server,
        { url: '/1.0.0/waxtest/0/0/0.grid.json?callback=grid' },
        { status: 200, body: /grid\(/ }
    );
};

exports['layer json'] = function() {
    assert.response(
        command.servers['UI'].server,
        { url: '/1.0.0/waxtest/layer.json?callback=grid' },
        { status: 200, body: /grid\(/ }
    );
};

exports['mbtiles download'] = function() {
    assert.response(
        command.servers['UI'].server,
        { url: '/download/control_room.mbtiles' },
        { status: 200 },
        function(res) {
            // @TODO: determine why download is sometimes off by 1 (or more?) byte(s)
            assert.ok(res.body.length >= 2976208 || res.body.length <= 2976209);
        }
    );
};

exports['load map'] = function() {
    assert.response(
        command.servers['UI'].server,
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
};

exports['load map v1'] = function() {
    assert.response(
        command.servers['UI'].server,
        { url: '/api/v1/Tileset/control_room' },
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
};

exports['load maps'] = function() {
    assert.response(
        command.servers['UI'].server,
        { url: '/api/Tileset' },
        { status: 200 },
        function(res) {
            var maps;
            assert.doesNotThrow(function() {
                maps = JSON.parse(res.body);
            }, SyntaxError);
            assert.equal(maps.length, 2);
            assert.equal(maps[0].id, 'control_room');
            assert.equal(maps[0].type, 'baselayer');
            assert.equal(maps[0].bounds, "-180,-85.05112877980659,180,89.99075251648905");
        }
    );
};

exports['load maps v1'] = function() {
    assert.response(
        command.servers['UI'].server,
        { url: '/api/v1/Tileset' },
        { status: 200 },
        function(res) {
            var maps;
            assert.doesNotThrow(function() {
                maps = JSON.parse(res.body);
            }, SyntaxError);
            assert.equal(maps.length, 2);
            assert.equal(maps[0].id, 'control_room');
            assert.equal(maps[0].type, 'baselayer');
            assert.equal(maps[0].bounds, "-180,-85.05112877980659,180,89.99075251648905");
        }
    );
};

exports['ssviews list'] = function() {
    assert.response(
        command.servers['UI'].server,
        { url: '/' },
        { status: 200, body: /name\">control_room/ }
    );
};

exports['ssviews map'] = function() {
    assert.response(
        command.servers['UI'].server,
        { url: '/map/control_room' },
        { status: 200, body: /control_room<\/a/ }
    );
    assert.response(
        command.servers['UI'].server,
        { url: '/?_escaped_fragment_=/map/control_room' },
        { status: 200, body: /control_room<\/a/ }
    );
};

exports['settings'] = function() {
    assert.response(
        command.servers['UI'].server,
        { url: '/settings.js' },
        { status: 200 }
    );
};

exports['wax endpoint'] = function() {
    var fs = require('fs'),
        fixtures = {
            layers: JSON.parse(fs.readFileSync(__dirname + '/fixtures/wax/wax.layers.json', 'utf8')),
            el:     JSON.parse(fs.readFileSync(__dirname + '/fixtures/wax/wax.el.json', 'utf8')),
            center: JSON.parse(fs.readFileSync(__dirname + '/fixtures/wax/wax.center.json', 'utf8')),
            options: JSON.parse(fs.readFileSync(__dirname + '/fixtures/wax/wax.options.json', 'utf8'))
        };
    assert.response(
        command.servers['UI'].server,
        { url: '/api/wax.json?api=foo' },
        { status: 400, body: /`api` is invalid/ }
    );

    assert.response(
        command.servers['UI'].server,
        { url: '/api/wax.json' },
        { status: 400, body: /`layers` is invalid/ }
    );
    assert.response(
        command.servers['UI'].server,
        { url: '/api/wax.json?layers=foo' },
        { status: 400, body: /`layers` is invalid/ }
    );
    assert.response(
        command.servers['UI'].server,
        { url: '/api/wax.json?layers[]=foo' },
        { status: 400, body: /`layers` is invalid/ }
    );
    assert.response(
        command.servers['UI'].server,
        _.extend({ url: '/api/wax.json?layers[]=control_room' }, request),
        { status: 200 },
        function(res) {
            assert.deepEqual(fixtures.layers, JSON.parse(res.body));
        }
    );
    assert.response(
        command.servers['UI'].server,
        _.extend({ url: '/api/v1/wax.json?layers[]=control_room' }, request),
        { status: 200 },
        function(res) {
            assert.deepEqual(fixtures.layers, JSON.parse(res.body));
        }
    );

    assert.response(
        command.servers['UI'].server,
        { url: '/api/wax.json?layers[]=control_room&el[]=foo' },
        { status: 400, body: /`el` is invalid/ }
    );
    assert.response(
        command.servers['UI'].server,
        _.extend({ url: '/api/wax.json?layers[]=control_room&el=foo' }, request),
        { status: 200 },
        function(res) {
            assert.deepEqual(fixtures.el, JSON.parse(res.body));
        }
    );

    assert.response(
        command.servers['UI'].server,
        { url: '/api/wax.json?layers[]=control_room&center=foo' },
        { status: 400, body: /`center` is invalid/ }
    );
    assert.response(
        command.servers['UI'].server,
        { url: '/api/wax.json?layers[]=control_room&center[]=0' },
        { status: 400, body: /`center` is invalid/ }
    );
    assert.response(
        command.servers['UI'].server,
        { url: '/api/wax.json?layers[]=control_room&center[]=0&center[]=0&center[]=foo' },
        { status: 400, body: /`center` is invalid/ }
    );
    assert.response(
        command.servers['UI'].server,
        _.extend({ url: '/api/wax.json?layers[]=control_room&center[]=40&center[]=40&center[]=2' }, request),
        { status: 200 },
        function(res) {
            assert.deepEqual(fixtures.center, JSON.parse(res.body));
        }
    );

    assert.response(
        command.servers['UI'].server,
        { url: '/api/wax.json?layers[]=control_room&options=foo' },
        { status: 400, body: /`options` is invalid/ }
    );
    assert.response(
        command.servers['UI'].server,
        { url: '/api/wax.json?layers[]=control_room&options[]=foo' },
        { status: 400, body: /`options` is invalid/ }
    );
    assert.response(
        command.servers['UI'].server,
        _.extend({ url: '/api/wax.json?layers[]=control_room&options[]=tooltips' }, request),
        { status: 200 },
        function(res) {
            assert.deepEqual(fixtures.options, JSON.parse(res.body));
        }
    );
};

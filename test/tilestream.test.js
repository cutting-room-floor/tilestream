process.env.NODE_ENV = 'test';
var _ = require('underscore');
var assert = require('assert');

// Load application.
require('..');
var tilestream = require('bones').plugin;
tilestream.config = {
    host: 'localhost',
    tiles: __dirname + '/fixtures/tiles',
    uiPort: 8888,
    tilePort: 8888,
    subdomains: 'a,b,c,d'
};
var server = new tilestream.servers.Core(tilestream);
var request = { headers: { 'host': 'localhost:8888' } };

exports['tile 1.0.0'] = function() {
    assert.response(
        server,
        { url: '/1.0.0/control_room/3/4/5.png' },
        { status: 200 },
        function(res) {
            assert.equal(res.headers['content-length'], 63554);
            assert.equal(res.headers['content-type'], 'image/png');
            assert.equal(res.headers['cache-control'], 'max-age=3600');
            assert.ok(res.headers['last-modified']);
            assert.ok(res.headers['etag']);
        }
    );
};


exports['tile invalid name'] = function() {
    assert.response(
        server,
        { url: '/1.0.0/bad.name/0/0/0.png' },
        {
            body: /Tileset does not exist/,
            status: 404
        }
    );
};

exports['error tile'] = function() {
    assert.response(
        server,
        { url: '/1.0.0/control_room/-1/-1/-1.png' },
        {
            body: /Tile does not exist/,
            status: 404
        }
    );
};

exports['grid tile'] = function() {
    assert.response(
        server,
        { url: '/1.0.0/waxtest/0/0/0.grid.json?callback=grid' },
        { status: 200, body: /grid\(/ }
    );
};

exports['layer json'] = function() {
    assert.response(
        server,
        { url: '/1.0.0/waxtest/layer.json?callback=grid' },
        { status: 200, body: /grid\(/ },
        function(res) {
            var body = JSON.parse(res.body.substring(5, res.body.length - 2));
            assert.deepEqual(body, {
                id: 'waxtest',
                size: 742400,
                basename: 'waxtest.mbtiles',
                name: 'waxtest',
                type: 'baselayer',
                description: 'Interaction and legend test tiles',
                version: '1.0.0',
                formatter: 'function(options, data) { if (options.format === \'full\') { return \'<strong>\' + data.NAME + \'</strong><br/><small>Population \' + data.POP2005 + \'</small>\'; } else { return \'<strong>\' + data.NAME + \'</strong><br/><small>Population \' + data.POP2005 + \'</small>\'; } }',
                bounds: [ -179.99992505544913, -85.05112231458043, 179.99992505544913, 85.05112231458043 ],
                minzoom: 0,
                maxzoom: 4,
                center: [ 0, 0, 2 ],
                legend: null,
                scheme: 'tms',
                host: ['http://127.0.0.1:5555/']
            });
        }
    );
};

exports['mbtiles download'] = function() {
    assert.response(
        server,
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
        server,
        _({ url: '/api/Tileset/control_room' }).extend(request),
        { status: 200 },
        function(res) {
            var map;
            assert.doesNotThrow(function() {
                map = JSON.parse(res.body);
            }, SyntaxError);
            assert.equal(map.id, 'control_room');
            assert.equal(map.type, 'baselayer');
            assert.equal(map.bounds, "-180,-85.05112877980659,180,89.99075251648905");
            assert.deepEqual(map.host, ['http://a.localhost:8888/', 'http://b.localhost:8888/', 'http://c.localhost:8888/', 'http://d.localhost:8888/']);
        }
    );
};

exports['load map v1'] = function() {
    assert.response(
        server,
        _({ url: '/api/v1/Tileset/control_room' }).extend(request),
        { status: 200 },
        function(res) {
            var map;
            assert.doesNotThrow(function() {
                map = JSON.parse(res.body);
            }, SyntaxError);
            assert.equal(map.id, 'control_room');
            assert.equal(map.type, 'baselayer');
            assert.equal(map.bounds, '-180,-85.05112877980659,180,89.99075251648905');
            assert.deepEqual(map.host, ['http://a.localhost:8888/', 'http://b.localhost:8888/', 'http://c.localhost:8888/', 'http://d.localhost:8888/']);

        }
    );
};

var loadMaps = function(res) {
    var maps;
    assert.doesNotThrow(function() {
        maps = JSON.parse(res.body);
    }, SyntaxError);
    assert.equal(maps.length, 2);
    assert.equal(maps[0].id, 'control_room');
    assert.equal(maps[0].type, 'baselayer');
    assert.equal(maps[0].bounds, '-180,-85.05112877980659,180,89.99075251648905');
    assert.deepEqual(maps[0].host, ['http://a.localhost:8888/', 'http://b.localhost:8888/', 'http://c.localhost:8888/', 'http://d.localhost:8888/']);
};

exports['load maps'] = function() {
    assert.response(
        server,
        _({ url: '/api/Tileset' }).extend(request),
        { status: 200 },
        loadMaps
    );
};

exports['load maps v1'] = function() {
    assert.response(
        server,
        _({ url: '/api/v1/Tileset' }).extend(request),
        { status: 200 },
        loadMaps
    );
};

exports['ssviews list'] = function() {
    assert.response(
        server,
        _({ url: '/' }).extend(request),
        { status: 200, body: /name\">control_room/ }
    );
};

exports['ssviews map'] = function() {
    assert.response(
        server,
        _({ url: '/map/control_room' }).extend(request),
        { status: 200, body: /control_room<\/a/ }
    );
    assert.response(
        server,
        { url: '/?_escaped_fragment_=/map/control_room' },
        { status: 301 }
    );
};

exports['ssviews error'] = function() {
    assert.response(
        server,
        _({ url: '/map/asdf' }).extend(request),
        { status: 503, body: /Connection problem.<\/div/ }
    );
    assert.response(
        server,
        { url: '/?_escaped_fragment_=/map/asdf' },
        { status: 301 }
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
        server,
        { url: '/api/wax.json?api=foo' },
        { status: 400, body: /`api` is invalid/ }
    );

    assert.response(
        server,
        { url: '/api/wax.json' },
        { status: 400, body: /`layers` is invalid/ }
    );
    assert.response(
        server,
        { url: '/api/wax.json?layers=foo' },
        { status: 400, body: /`layers` is invalid/ }
    );
    assert.response(
        server,
        { url: '/api/wax.json?layers[]=foo' },
        { status: 500, body: /Tileset does not exist/ }
    );
    assert.response(
        server,
        _.extend({ url: '/api/wax.json?layers[]=control_room' }, request),
        { status: 200 },
        function(res) {
            assert.deepEqual(fixtures.layers, JSON.parse(res.body));
        }
    );
    assert.response(
        server,
        _.extend({ url: '/api/v1/wax.json?layers[]=control_room' }, request),
        { status: 200 },
        function(res) {
            assert.deepEqual(fixtures.layers, JSON.parse(res.body));
        }
    );

    assert.response(
        server,
        { url: '/api/wax.json?layers[]=control_room&el[]=foo' },
        { status: 400, body: /`el` is invalid/ }
    );
    assert.response(
        server,
        _.extend({ url: '/api/wax.json?layers[]=control_room&el=foo' }, request),
        { status: 200 },
        function(res) {
            assert.deepEqual(fixtures.el, JSON.parse(res.body));
        }
    );

    assert.response(
        server,
        { url: '/api/wax.json?layers[]=control_room&center=foo' },
        { status: 400, body: /`center` is invalid/ }
    );
    assert.response(
        server,
        { url: '/api/wax.json?layers[]=control_room&center[]=0' },
        { status: 400, body: /`center` is invalid/ }
    );
    assert.response(
        server,
        { url: '/api/wax.json?layers[]=control_room&center[]=0&center[]=0&center[]=foo' },
        { status: 400, body: /`center` is invalid/ }
    );
    assert.response(
        server,
        _.extend({ url: '/api/wax.json?layers[]=control_room&center[]=40&center[]=40&center[]=2' }, request),
        { status: 200 },
        function(res) {
            assert.deepEqual(fixtures.center, JSON.parse(res.body));
        }
    );

    assert.response(
        server,
        { url: '/api/wax.json?layers[]=control_room&options=foo' },
        { status: 400, body: /`options` is invalid/ }
    );
    assert.response(
        server,
        { url: '/api/wax.json?layers[]=control_room&options[]=foo' },
        { status: 400, body: /`options` is invalid/ }
    );
    assert.response(
        server,
        _.extend({ url: '/api/wax.json?layers[]=control_room&options[]=tooltips' }, request),
        { status: 200 },
        function(res) {
            assert.deepEqual(fixtures.options, JSON.parse(res.body));
        }
    );
};

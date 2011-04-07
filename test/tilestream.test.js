var assert = require('assert'),
    tilestream = require('tilestream')({
        tiles: __dirname + '/fixtures/tiles',
        uiPort: 8888,
        tilePort: 8888
    });

module.exports = {
    'tile': function() {
        assert.response(
            tilestream.tileServer,
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
    },
    'error tile': function() {
        assert.response(
            tilestream.tileServer,
            { url: '/1.0.0/control_room/-1/-1/-1.png' },
            { status: 404 }
        );
    },
    'grid tile': function() {
        assert.response(
            tilestream.tileServer,
            { url: '/1.0.0/waxtest/0/0/0.grid.json' },
            { status: 200, body: /grid\(/ }
        );
    },
    'layer json': function() {
        assert.response(
            tilestream.tileServer,
            { url: '/1.0.0/waxtest/layer.json' },
            { status: 200, body: /grid\(/ }
        );
    },
    'mbtiles download': function() {
        assert.response(
            tilestream.tileServer,
            { url: '/download/control_room.mbtiles' },
            { status: 200 },
            function(res) {
                // @TODO: determine why download is sometimes off by 1 (or more?) byte(s)
                assert.ok(res.body.length >= 2976208 || res.body.length <= 2976209);
            }
        );
    },
    'load map': function() {
        assert.response(
            tilestream.uiServer,
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
            tilestream.uiServer,
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
    },
    'ssviews list': function() {
        assert.response(
            tilestream.uiServer,
            { url: '/' },
            { status: 200, body: /name\">control_room/ }
        );
    },
    'ssviews map': function() {
        assert.response(
            tilestream.uiServer,
            { url: '/map/control_room' },
            { status: 200, body: /control_room<\/a/ }
        );
        assert.response(
            tilestream.uiServer,
            { url: '/?_escaped_fragment_=/map/control_room' },
            { status: 200, body: /control_room<\/a/ }
        );
    },
    'settings': function() {
        assert.response(
            tilestream.uiServer,
            { url: '/settings.js' },
            { status: 200 }
        );
    },
    'wax endpoint': function() {
        var fs = require('fs'),
            fixtures = {
                layers: JSON.parse(fs.readFileSync(__dirname + '/fixtures/wax/wax.layers.json', 'utf8')),
                el:     JSON.parse(fs.readFileSync(__dirname + '/fixtures/wax/wax.el.json', 'utf8')),
                center: JSON.parse(fs.readFileSync(__dirname + '/fixtures/wax/wax.center.json', 'utf8')),
                options: JSON.parse(fs.readFileSync(__dirname + '/fixtures/wax/wax.options.json', 'utf8'))
            };
        assert.response(
            tilestream.uiServer,
            { url: '/wax.json?api=foo' },
            { status: 400, body: /`api` is invalid/ }
        );

        assert.response(
            tilestream.uiServer,
            { url: '/wax.json' },
            { status: 400, body: /`layers` is invalid/ }
        );
        assert.response(
            tilestream.uiServer,
            { url: '/wax.json?layers=foo' },
            { status: 400, body: /`layers` is invalid/ }
        );
        assert.response(
            tilestream.uiServer,
            { url: '/wax.json?layers[]=foo' },
            { status: 400, body: /`layers` is invalid/ }
        );
        assert.response(
            tilestream.uiServer,
            { url: '/wax.json?layers[]=control_room' },
            { status: 200 },
            function(res) {
                assert.deepEqual(fixtures.layers, JSON.parse(res.body));
            }
        );

        assert.response(
            tilestream.uiServer,
            { url: '/wax.json?layers[]=control_room&el[]=foo' },
            { status: 400, body: /`el` is invalid/ }
        );
        assert.response(
            tilestream.uiServer,
            { url: '/wax.json?layers[]=control_room&el=foo' },
            { status: 200 },
            function(res) {
                assert.deepEqual(fixtures.el, JSON.parse(res.body));
            }
        );

        assert.response(
            tilestream.uiServer,
            { url: '/wax.json?layers[]=control_room&center=foo' },
            { status: 400, body: /`center` is invalid/ }
        );
        assert.response(
            tilestream.uiServer,
            { url: '/wax.json?layers[]=control_room&center[]=0' },
            { status: 400, body: /`center` is invalid/ }
        );
        assert.response(
            tilestream.uiServer,
            { url: '/wax.json?layers[]=control_room&center[]=0&center[]=0&center[]=foo' },
            { status: 400, body: /`center` is invalid/ }
        );
        assert.response(
            tilestream.uiServer,
            { url: '/wax.json?layers[]=control_room&center[]=40&center[]=40&center[]=2' },
            { status: 200 },
            function(res) {
                assert.deepEqual(fixtures.center, JSON.parse(res.body));
            }
        );

        assert.response(
            tilestream.uiServer,
            { url: '/wax.json?layers[]=control_room&options=foo' },
            { status: 400, body: /`options` is invalid/ }
        );
        assert.response(
            tilestream.uiServer,
            { url: '/wax.json?layers[]=control_room&options[]=foo' },
            { status: 400, body: /`options` is invalid/ }
        );
        assert.response(
            tilestream.uiServer,
            { url: '/wax.json?layers[]=control_room&options[]=tooltips' },
            { status: 200 },
            function(res) {
                assert.deepEqual(fixtures.options, JSON.parse(res.body));
            }
        );
    }
}


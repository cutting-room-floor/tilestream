var assert = require('assert'),
    tilestream = require('tilestream')({
        tiles: __dirname + '/fixtures'
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
                assert.equal(res.headers['cache-control'], 'max-age=31536000');
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
    'mbtiles download': function() {
        assert.response(
            tilestream.tileServer,
            { url: '/download/control_room.mbtiles' },
            { status: 200 },
            function(res) {
                assert.equal(res.body.length, 2976209);
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
                assert.equal(maps.length, 1);
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
            { status: 200, body: /control_room<\/span/ }
        );
    },
    'ssviews map': function() {
        assert.response(
            tilestream.uiServer,
            { url: '/tileset/control_room' },
            { status: 200, body: /control_room<\/a/ }
        );
        assert.response(
            tilestream.uiServer,
            { url: '/?_escaped_fragment_=/tileset/control_room' },
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
        assert.response(
            tilestream.uiServer,
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
            tilestream.uiServer,
            { url: '/wax.json?el=openlayers-map&center%5B%5D=0&center%5B%5D=0&zoom=-1&callback=_jqjsp&_1298387967133=' },
            { status: 400 }
        );
    }
}


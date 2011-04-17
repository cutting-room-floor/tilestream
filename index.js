var _ = require('underscore')._,
    fs = require('fs'),
    path = require('path'),
    express = require('express');

module.exports = function(options) {
    // Allow options to be passed via `--config [JSON file]`.
    if (options && options.config) {
        try {
            var config = JSON.parse(fs.readFileSync(options.config, 'utf8'));
            _(options).extend(config);
        } catch(e) {
            console.log('Invalid JSON config file: ' + options.config);
        }
    }

    options = options || {};
    options.uiPort = options.uiPort || 8888;
    options.tilePort = options.tilePort || 8888;
    options.tiles = options.tiles || path.join(process.cwd(), 'tiles');
    options.syslog = options.syslog || false;
    // @TODO: how to alter these hashes with commandline options?
    // Default tile response headers. Sets max-age to one hour.
    options.header_defaults = { 'Cache-Control': 'max-age=' + 60 * 60 };

    var exports = {};
    if (options.uiPort == options.tilePort) {
        exports.server = express.createServer();
        exports.uiServer = exports.server;
        exports.tileServer = exports.server;
    } else {
        exports.server = false;
        exports.uiServer = express.createServer();
        exports.tileServer = express.createServer();
    }

    // The init callback is called prior to any commands, allowing for
    // asynchronous setup operations to finish before moving on.
    exports.init = function(options, callback) {
        // Add host info middleware.
        var host = require('./server/host')(options);
        exports.uiServer.use(host.middleware);
        exports.tileServer.use(host.middleware);

        // Bootstrap.
        require('tilestream/server/bootstrap')(options);
        require('tilestream/server/ui-server')(exports.uiServer, options);
        require('tilestream/server/tile-server')(exports.tileServer, options);

        // Load tilesets.
        require('tilestream/server/tileset').all(options.tiles, callback);
        console.log('Loading tilesets...');
    };
    exports.commands = {
        'start': {
            name: 'start',
            description: 'start server',
            options: {
                '--config=PATH': 'Pass options via JSON config file at PATH.',
                '--uiPort=PORT': 'UI server port. Defaults to 8888.',
                '--tilePort=PORT': 'Tile server port. Defaults to 8888.',
                '--subdomains=LIST': 'Comma separated list of subdomains to use for tiles.',
                '--tiles=PATH': 'Path to tiles directory.',
                '--syslog': 'Log to syslog instead of stdout.'
            },
            command: function(argv, callback) {
                if (options.syslog) console.log('\033[1;33mNote: Logging to syslog.\033[0m');

                if (exports.server) {
                    exports.server.listen(options.uiPort);
                    console.log('Started server on port %d.', options.uiPort);
                } else {
                    exports.uiServer.listen(options.uiPort);
                    exports.tileServer.listen(options.tilePort);
                    console.log('Started ui server on port %d.', options.uiPort);
                    console.log('Started tile server on port %d.', options.tilePort);
                }
            }
        }
    };
    return exports;
};

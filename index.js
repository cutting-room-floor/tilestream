var _ = require('underscore')._,
    fs = require('fs'),
    path = require('path'),
    express = require('express');

module.exports = function(options) {
    // Allow options to be passed via `--config [JSON file]`.
    if (options && options.config) {
        try {
            options = JSON.parse(fs.readFileSync(options.config, 'utf8'));
        } catch(e) {
            console.log('Invalid JSON config file: ' + options.config);
        }
    }

    options = options || {};
    options.uiPort = options.uiPort || 8888;
    options.uiHost = options.uiHost || false;
    options.tilePort = options.tilePort || 8888;
    options.tileHost = options.tileHost ? options.tileHost.split(',') : [];
    options.tiles = options.tiles || path.join(process.cwd(), 'tiles');
    // @TODO: how to alter these hashes with commandline options?
    // Default tile response headers. Sets max-age to one year.
    options.header_defaults = {
        'Cache-Control': 'max-age=' + 60 * 60 * 24 * 365
    };
    options.features = {
        download: true,
        info: true
    };

    if (options.uiPort == options.tilePort) {
        var server = express.createServer(),
            uiServer = server,
            tileServer = server;
    } else {
        var server = false,
            uiServer = express.createServer(),
            tileServer = express.createServer();
    }

    // Bootstrap.
    require('tilestream/server/bootstrap')(options);
    require('tilestream/server/ui-server')(uiServer, options);
    require('tilestream/server/tile-server')(tileServer, options);

    var commands = {
        'start': {
            name: 'start',
            description: 'start server',
            options: {
                '--config=PATH': 'Pass options via JSON config file at PATH.',
                '--uiPort=PORT': 'UI server port. Defaults to 8888.',
                '--uiHost=HOST': 'UI server hostname. Defaults to localhost.',
                '--tilePort=PORT': 'Tile server port. Defaults to 8888.',
                '--tileHost=HOST': 'Tile server hostname(s). Defaults to localhost.',
                '--tiles=PATH': 'Path to tiles directory.'
            },
            command: function(argv, callback) {
                if (server) {
                    server.listen(options.uiPort);
                    console.log('Started server on port %d.', options.uiPort);
                } else {
                    uiServer.listen(options.uiPort);
                    tileServer.listen(options.tilePort);
                    console.log('Started ui server on port %d.', options.uiPort);
                    console.log('Started tile server on port %d.', options.tilePort);
                }
            }
        }
    };
    return {
        commands: commands,
        uiServer: uiServer,
        tileServer: tileServer
    };
};

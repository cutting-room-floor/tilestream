var fs = require('fs');
var os = require('os');
var path = require('path');
var util = require('util');
var existsSync = require('fs').existsSync || require('path').existsSync;

let homedir = os.homedir()

function mkdirpSync(p, mode) {
    var ps = path.normalize(p).split('/');
    var created = [];
    while (ps.length) {
        created.push(ps.shift());
        if (created.length > 1 && !existsSync(created.join('/'))) {
            var err = fs.mkdirSync(created.join('/'), 0755);
            if (err) return err;
        }
    }
};

// Application bootstrap. Ensures that tiles directory exists at server start.
module.exports = function(settings, callback) {
    try {
        fs.statSync(settings.tiles);
    } catch (Exception) {
        if (!homedir) {
            console.log('Could not locate home directory. Set location manually with the --tiles option.');
            process.exit(1);
        } else {
            try {
                console.log('Creating tiles dir %s', settings.tiles);
                mkdirpSync(settings.tiles, 0777);
            } catch (Exception) {
                console.log('Could not create tiles directory at %s.');
                process.exit(1);
            }
        }
    }

    callback();
};

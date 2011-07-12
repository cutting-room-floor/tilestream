var util = require('util');

// Application bootstrap. Ensures that tiles directory exists at server start.
module.exports = function(settings, callback) {
    var fs = require('fs');
    try {
        fs.statSync(settings.tiles);
    } catch (Exception) {
        if (!process.env.HOME) {
            console.log('Could not locate home directory. Set location manually with the --tiles option.');
            process.exit(1);
        } else {
            try {
                console.log('Creating tiles dir %s', settings.tiles);
                fs.mkdirSync(settings.tiles, 0777);
            } catch (Exception) {
                console.log('Could not create tiles directory at %s.');
                process.exit(1);
            }
        }
    }

    callback();
};

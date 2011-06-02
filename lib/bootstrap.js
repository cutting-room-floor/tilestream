var util = require('util');

// Application bootstrap. Ensures that tiles directory exists at server start.
module.exports = function(settings, callback) {
    var fs = require('fs');
    try {
        fs.statSync(settings.tiles);
    } catch (Exception) {
        console.log('Creating tiles dir %s', settings.tiles);
        fs.mkdirSync(settings.tiles, 0777);
    }

    callback();
};

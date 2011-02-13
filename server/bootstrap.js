// Application bootstrap. Ensures that files directories exist at server start.
module.exports = function(settings) {
    var fs = require('fs');
    try {
        fs.statSync(settings.tiles);
    } catch (Exception) {
        console.log('Creating tiles dir %s', settings.tiles);
        fs.mkdirSync(settings.tiles, 0777);
    }
}


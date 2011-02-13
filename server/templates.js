// Retrieve all templates, compile them, and store them in a cache. This is
// synchronous and should happen at server start time.
var fs = require('fs'),
    path = require('path'),
    Templates;

module.exports = function(options) {
    options = options || {};
    options.path = options.path || 'templates';
    if (!Templates) {
        Templates = {};
        var files = fs.readdirSync(options.path);
        for (var i = 0; i < files.length; i++) {
            var key = path.basename(files[i], '.hbs');
            var filepath = path.join(options.path, files[i]);
            Templates[key] = fs.readFileSync(filepath, 'utf-8');
        }
        Templates.toJS = function() {
            return 'var Templates = ' + JSON.stringify(this);
        };
    }
    return Templates;
}

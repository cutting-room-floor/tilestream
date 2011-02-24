// Add templates to Bones template cache.
var fs = require('fs'),
    path = require('path'),
    Bones = require('bones');

module.exports = function(options) {
    options = options || {};
    options.path = options.path || 'templates';
    var files = fs.readdirSync(options.path);
    for (var i = 0; i < files.length; i++) {
        var key = path.basename(files[i], '.hbs');
        var filepath = path.join(options.path, files[i]);
        Bones.templates[key] = fs.readFileSync(filepath, 'utf-8');
    }
}


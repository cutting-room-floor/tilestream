// Server-side sync method for Tileset model.
module.exports = function(settings) {
    var models = require('./models'),
        tileset = require('../server/tileset')(settings);
    models.Tileset.prototype.sync =
    models.Tilesets.prototype.sync = function(method, model, success, error) {
        switch (method) {
        case 'read':
            if (model.id) {
                tileset.load(model, function(err, model) {
                    return err ? error(err) : success(model);
                });
            }
            else {
                tileset.all(model, function(err, model) {
                    return err ? error(err) : success(model);
                });
            }
            break;
        }
    };
};


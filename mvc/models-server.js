var models = require('./models'),
    tileset = require('../server/tileset');

// Server-side sync method for Tileset model.
module.exports = function(settings) {
    models.Tileset.prototype.sync =
    models.Tilesets.prototype.sync = function(method, model, success, error) {
        switch (method) {
        case 'read':
            if (model.id) {
                tileset.load(model.filepath(settings.tiles), function(err, data) {
                    return err ? error(err) : success(data);
                });
            }
            else {
                tileset.all(model.filepath(settings.tiles), function(err, data) {
                    return err ? error(err) : success(data);
                });
            }
            break;
        }
    };
};


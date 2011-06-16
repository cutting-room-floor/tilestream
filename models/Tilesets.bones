// Tilesets
// --------
// Collection of all tileset models.
model = Backbone.Collection.extend({
    model: models.Tileset,
    url: function() {
        return this.options.basepath + 'api/Tileset';
    },
    comparator: function(model) {
        return (model.get('name') || model.get('id')).toLowerCase();
    },
    // Function for determining the server-side filepath of a Tilesets
    // collection.
    filepath: function(path) {
        path += this.options.basepath;
        (path.charAt(path.length) === '/') && (path = path.substr(0, path.length - 1));
        return path;
    }
});


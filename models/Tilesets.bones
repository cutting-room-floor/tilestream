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
    }
});

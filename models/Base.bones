model = Backbone.Model;

// Set options on initialize.
Backbone.Collection.prototype.initialize =
Backbone.Model.prototype.initialize = function(attributes, options) {
    if (this.collection && this.collection.options) {
        this.options = _(this.collection.options).clone();
    } else {
        this.options = _(options || {}).clone();
    }
    if (this.models) {
        _(this.models).each(_(function(model) {
            model.options = _(this.options).clone();
        }).bind(this));
    }
};

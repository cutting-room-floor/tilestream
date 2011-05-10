model = Backbone.Model;

// Set options on initialize.
Backbone.Collection.prototype.initialize =
Backbone.Model.prototype.initialize = function(attributes, options) {
    options = options || {};
    if (this.collection && this.collection.options) {
        this.options = this.collection.options;
    } else {
        this.options = options;
    }
    if (this.models) {
        _(this.models).each(_(function(model) {
            model.options = this.options;
        }).bind(this));
    }
};

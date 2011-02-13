// Server-side override of `PageView`. Overrides `.render()` method to send the
// templated page contents back to the client via HTTP response `res` object.
// See `shared/controller.js` for where `PageView` is called.
var views = require('views');
views.PageView.prototype.templateName = 'PageView';
views.PageView.prototype.render = function() {
    var page = this.template({ content: this.options.view.html() });
    this.options.res.send(page);
    return this;
};

module.exports = views;

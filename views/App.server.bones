views['App'].augment({
    render: function(parent) {
        this.el = templates.App(this.options);
        return this;
    }
});


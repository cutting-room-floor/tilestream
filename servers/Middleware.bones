servers['Middleware'].augment({
    initialize: function(parent, app) {
        parent.call(this, app);
        this.use(new servers['Cors'](app));
        this.use(new servers['Host'](app));
    }
});


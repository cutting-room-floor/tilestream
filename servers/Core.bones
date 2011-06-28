servers['Core'].augment({
    initialize: function(parent, app) {
        parent.call(this, app);
        this.use(new servers['Wax'](app));
        if (app.config.tilePort === app.config.uiPort) {
            this.use(new servers['Tile'](app));
        }
        this.enable('jsonp callback');
        this.port = app.config.uiPort;
    }
});

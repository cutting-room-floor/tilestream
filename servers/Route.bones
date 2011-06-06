servers['Route'].augment({
    assets: {
        styles: new mirror([
            require.resolve('../assets/css/reset.css'),
            require.resolve('../assets/css/controls.css'),
            require.resolve('../assets/css/style.css')
        ], { type: '.css' }),
        scripts: new mirror([
            require.resolve('wax/ext/modestmaps.js'),
            require.resolve('wax/dist/wax.mm.min.js')
        ], { type: '.js'})
    },
    initializeAssets: function(parent, app) {
        parent.call(this, app);

        // Add our custom styles to the catchall file.
        this.assets.all.push(this.assets.scripts);

        this.get('/assets/tilestream/css/vendor.css', this.assets.styles);
        this.get('/assets/tilestream/js/vendor.js', this.assets.scripts);
    },
    initializeModels: function(parent, app) {
        this.models = app.models;
        _.bindAll(this, 'loadModel', 'getModel');
        this.get('/api/v1/:model/:id', this.loadModel, this.getModel);
        this.get('/api/v1/:collection', this.loadCollection.bind(this));
        parent.call(this, app);
    }
});

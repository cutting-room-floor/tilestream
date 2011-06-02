servers['Route'].augment({
    assets: {
        styles: [
            require.resolve('../assets/css/reset.css'),
            require.resolve('../assets/css/controls.css'),
            require.resolve('../assets/css/style.css')
        ],
        scripts: [
            require.resolve('wax/ext/modestmaps.js'),
            require.resolve('wax/build/wax.mm.min.js')
        ]
    },
    initializeAssets: function(parent, app) {
        parent.call(this, app);
        this.get('/assets/tilestream/css/vendor.css',
            new mirror(this.assets.styles, { type: '.css' }));
        this.get('/assets/tilestream/js/vendor.js',
            new mirror(this.assets.scripts, { type: '.js' }));
    },
    initializeModels: function(parent, app) {
        this.models = app.models;
        _.bindAll(this, 'loadModel', 'getModel');
        this.get('/api/v1/:model/:id', this.loadModel, this.getModel);
        this.get('/api/v1/:collection', this.loadCollection.bind(this));
        parent.call(this, app);
    }
});

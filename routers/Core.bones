router = routers['Core'];

router.augment({
    initializeAssets: function(parent, app) {
        parent.call(this, app);

        app.assets.styles = [
            require.resolve('../assets/css/reset.css'),
            require.resolve('../assets/css/controls.css'),
            require.resolve('../assets/css/style.css')
        ];
        this.server.get('/assets/tilestream/css/vendor.css',
            mirror.assets(app.assets.styles, { type: '.css' }));

        app.assets.scripts = [
            require.resolve('openlayers_slim/OpenLayers.js'),
            require.resolve('wax/build/wax.ol.min.js')
        ];
        this.server.get('/assets/tilestream/js/vendor.js',
            mirror.assets(app.assets.scripts, { type: '.js' }));

        this.server.get('/theme/default/style.css', mirror.assets([
            'openlayers_slim/theme/default/style.css'
        ], { type: '.css' }));
    },
    initializeModels: function(parent, app) {
        this.models = app.models;
        _.bindAll(this, 'loadModel', 'getModel');

        this.server.get('/api/v1/:model/:id', this.loadModel, this.getModel);
        this.server.get('/api/v1/:collection', this.loadCollection.bind(this));

        parent.call(this, app);
    }
});

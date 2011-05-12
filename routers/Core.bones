router = routers['Core'];

router.augment({
    initializeAssets: function(parent, app) {
        parent.call(this, app);

        app.assets.styles = _([
            '../assets/css/reset.css',
            '../assets/css/controls.css',
            '../assets/css/style.css'
        ]).map(function(path) { return require.resolve(path) });
        this.server.get('/assets/tilestream/css/vendor.css',
            mirror.assets(app.assets.styles, {headers:{'Content-Type': 'text/css'}}));

        app.assets.scripts = _([
            'openlayers_slim/OpenLayers.js',
            'wax/build/wax.ol.min.js'
        ]).map(function(path) { return require.resolve(path) });
        this.server.get('/assets/tilestream/js/vendor.js',
            mirror.assets(app.assets.scripts));

        this.server.get('/theme/default/style.css', mirror.assets(
            [require.resolve('openlayers_slim/theme/default/style.css')],
            {headers:{'Content-Type': 'text/css'}}
        ));
    },
    initializeModels: function(parent, app) {
        this.models = app.models;
        _.bindAll(this, 'loadModel', 'getModel');

        this.server.get('/api/v1/:model/:id', this.loadModel, this.getModel);
        this.server.get('/api/v1/:collection', this.loadCollection.bind(this));

        parent.call(this, app);
    }
});

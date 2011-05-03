router = routers['Core'];

router.augment({
    initializeAssets: function(parent, app) {
        this.server.get('/assets/tilestream/css/vendor.css', mirror.assets(require, [
            '../assets/css/reset.css',
            '../assets/css/controls.css',
            '../assets/css/style.css'
        ], {headers:{'Content-Type': 'text/css'}}));

        this.server.get('/assets/tilestream/js/vendor.js', mirror.assets(require, [
            'openlayers_slim/OpenLayers.js',
            'wax/build/wax.ol.min.js'
        ]));

        // @TODO.
        // server.get('/theme/default/style.css', mirror.file('openlayers_slim/theme/default/style.css'));
    },
    initializeModels: function(parent, app) {
        parent.call(this, app);
        this.server.get('/api/v1/:model/:id', this.loadModel, this.getModel);
    },
    initializeCollections: function(parent, app) {
        parent.call(this, app);
        this.server.get('/api/v1/:collection', this.loadCollection.bind(this));
    }
});

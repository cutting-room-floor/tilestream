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

        this.server.get('/theme/default/style.css', mirror.assets(require, [
            'openlayers_slim/theme/default/style.css'
        ], {headers:{'Content-Type': 'text/css'}}));

        parent.call(this, app);
    },
    initializeModels: function(parent, app) {
        this.models = app.models;
        _.bindAll(this, 'loadModel', 'getModel');

        this.server.get('/api/v1/:model/:id', this.loadModel, this.getModel);
        this.server.get('/api/v1/:collection', this.loadCollection.bind(this));

        parent.call(this, app);
    }
});

router = routers['Core'];

router.augment({
    initializeAssets: function(parent, app) {
        parent.call(this, app);

        app.assets.styles = [
            '../assets/css/reset.css',
            '../assets/css/controls.css',
            '../assets/css/style.css'
        ];
        this.server.get('/assets/tilestream/css/vendor.css',
            mirror.assets(require, app.assets.styles, {headers:{'Content-Type': 'text/css'}}));

        app.assets.scripts = [
            'openlayers_slim/OpenLayers.js',
            'wax/build/wax.ol.min.js'
        ];
        this.server.get('/assets/tilestream/js/vendor.js',
            mirror.assets(require, app.assets.scripts));

        this.server.get('/theme/default/style.css', mirror.assets(require, [
            'openlayers_slim/theme/default/style.css'
        ], {headers:{'Content-Type': 'text/css'}}));
    },
    initializeModels: function(parent, app) {
        this.models = app.models;
        _.bindAll(this, 'loadModel', 'getModel');

        this.server.get('/api/v1/:model/:id', this.loadModel, this.getModel);
        this.server.get('/api/v1/:collection', this.loadCollection.bind(this));

        parent.call(this, app);
    }
});

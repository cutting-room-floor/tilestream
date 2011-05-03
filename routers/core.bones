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
        return parent.call(this, app);
    }
});

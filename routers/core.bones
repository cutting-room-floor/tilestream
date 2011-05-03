router = routers['Core'];

router.augment({
    initializeAssets: function(parent, app) {
        this.server.get('/assets/tilestream/css/vendor.css', mirror.assets(require, [
            '../assets/css/reset.css',
            '../assets/css/controls.css',
            '../assets/css/style.css'
        ], {headers:{'Content-Type': 'text/css'}}));
        return parent.call(this, app);
    }
});

server = Bones.Server.extend({
    initialize: function(options) {
        this.port = options.config.uiPort;
        this.server.enable('jsonp callback');
        this.server.error(Error.HTTP.handler(options.config));
        models['Tileset'].register(this);
        models['Tilesets'].register(this);
        views['App'].register(this);
        views['Error'].register(this);
        views['Hud'].register(this);
        views['Map'].register(this);
        views['Maps'].register(this);
        views['MapClient'].register(this);

        routers['Host'].register(this);
        routers['Ui'].register(this);
        routers['Wax'].register(this);
        routers['Syslog'].register(this);
        routers['Core'].register(this);
        (options.config.tilePort === options.config.uiPort) && routers['Tile'].register(this);

        controllers['Router'].register(this);
    }
});

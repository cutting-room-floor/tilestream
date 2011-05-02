server = Bones.Server.extend({
    initialize: function(options) {
        this.port = options.config.uiPort;
        this.server.enable('jsonp callback');
        this.server.error(Error.HTTP.handler(options.config));
        this.register(models['Tileset']);
        this.register(models['Tilesets']);
        this.register(views['App']);
        this.register(views['Error']);
        this.register(views['Hud']);
        this.register(views['Map']);
        this.register(views['Maps']);
        this.register(views['MapClient']);
        this.register(controllers['Router']);
        this.register(routers['Host']);
        this.register(routers['Ui']);
        this.register(routers['Wax']);
        this.register(routers['Syslog']);

        if (options.config.tilePort === options.config.uiPort) {
            this.register(routers['Tile']);
        }
    }
});

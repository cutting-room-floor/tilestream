server = Bones.Server.extend({
    initialize: function(options) {
        if (options.config.tilePort === options.config.uiPort) {
            this.server = false;
            return;
        }

        this.port = options.config.tilePort;
        this.server.enable('jsonp callback');
        this.server.error(Error.HTTP.handler(options.config));
        routers['Syslog'].register(this);
        routers['Host'].register(this);
        routers['Tile'].register(this);
    },
    start: function() {
        if (this.server) {
            this.server.listen(this.port);
            return this;
        }
    }
});

server = Bones.Server.extend({
    initialize: function(options) {
        if (options.config.tilePort === options.config.uiPort) {
            this.server = false;
            return;
        }

        this.port = options.config.tilePort;
        this.server.enable('jsonp callback');
        this.server.error(Error.HTTP.handler(options.config));
        this.register(routers['Syslog']);
        this.register(routers['Tile']);
    },
    start: function() {
        this.server && this.server.listen(this.port);
        return this;
    }
});

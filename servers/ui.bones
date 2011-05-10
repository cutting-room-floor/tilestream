server = Bones.Server.extend({
    middleware: function(plugin) {
        server.__super__.middleware.call(this, plugin);

        this.port = plugin.config.uiPort;
        this.server.enable('jsonp callback');
        this.server.error(Error.HTTP.handler(plugin.config));

        routers['Syslog'].register(this);
        routers['Host'].register(this);
    },

    initialize: function(plugin) {
        routers['Wax'].register(this);
        (plugin.config.tilePort === plugin.config.uiPort) && routers['Tile'].register(this);

        // @TODO: consider change in Bones as it's not clear that the core
        // router must be registered before all other components.
        // TODO: this code registers the Core router twice.
        routers['Core'].register(this);
        _(['models', 'views', 'controllers', 'templates']).each(_(function(kind) {
            _(plugin[kind]).each(_(function(object) {
                object.register(this);
            }).bind(this));
        }).bind(this));
    }
});

server.title = 'UI';

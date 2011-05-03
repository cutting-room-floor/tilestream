router = Bones.Router.extend({
    initialize: function(options) {
        var config = options.plugin.config;

        // @TODO.
        // server.get('/theme/default/style.css', mirror.file('openlayers_slim/theme/default/style.css'));

        // @TODO.
        // Settings endpoint. Send information that need to be shared between
        // server/client.
        /*
        server.get('/settings.js', function(req, res, next) {
            res.send(
                'var Bones = Bones || {};\n' +
                'Bones.settings = ' + JSON.stringify(req.model.options) + ';',
                { 'Content-Type': 'text/javascript' }
            );
        });
        */

        // @TODO.
        // server.get('/api/v1/:model', validateCollection, getCollection);
        // server.all('/api/v1/:model/*', validateModel, getModel);
    }
});

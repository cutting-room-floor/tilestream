// Map
// ---
// View for exploring a single Map. Provides a fullscreen map client with HUD
// panels for info, download, etc.
view = views.HUD.extend({
    initialize: function(options) {
        views.HUD.prototype.initialize.call(this, options);
        _.bindAll(this, 'render', 'format');
        this.render().trigger('attach');
    },
    format: function(type, value) {
        switch (type) {
        case 'deg':
            return parseInt(value * 100, 10) / 100;
            break;
        case 'url':
            var id = this.model.id;
            return _.map(value, function(layer) {
                return layer + '1.0.0/' + id + '/{z}/{x}/{y}';
            });
            break;
        case 'download':
            return value + 'download/' + this.model.id + '.mbtiles';
            break;
        case 'size':
            return (Math.ceil(parseInt(value) / 1048576)) + ' MB';
            break;
        }
    },
    render: function() {
        $(this.el).html(templates.Map({
            breadcrumb: [{
                href: this.model.options.basepath + 'map/' + this.model.get('id'),
                title: this.model.get('name')
            }],
            buttons: [
                {id:'info', title:'Info'},
                {id:'download', title:'Download'}
            ],
            basepath: this.model.options.basepath,
            id: this.model.get('id'),
            name: this.model.get('name'),
            zoom: _.range(this.model.get('minzoom'), this.model.get('maxzoom') + 1),
            description: this.model.get('description') || null,
            type: this.model.get('type') || null,
            bounds: {
                w: this.format('deg', this.model.get('bounds')[0]),
                s: this.format('deg', this.model.get('bounds')[1]),
                e: this.format('deg', this.model.get('bounds')[2]),
                n: this.format('deg', this.model.get('bounds')[3])
            },
            url: this.format('url', this.model.layerURL()),
            download: this.format('download', this.model.layerURL()[0]),
            size: this.format('size', this.model.get('size'))
        }));
        this.map = new views.MapClient({model: this.model});
        this.bind('ready', this.map.ready);
        $(this.el).append(this.map.el);
        return this;
    }
});


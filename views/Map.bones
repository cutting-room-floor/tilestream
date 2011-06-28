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
                return layer + '2.0.0/' + id + '/{z}/{x}/{y}.png';
            });
            break;
        case 'download':
            return this.options.tileHost[0] + this.model.options.basepath + 'download/' + this.model.id + '.mbtiles';
            break;
        case 'size':
            return (Math.ceil(parseInt(value) / 1048576)) + ' MB';
            break;
        }
    },
    render: function() {
        var data = _({
            breadcrumb: [{
                href: this.model.options.basepath + 'map/' + this.model.get('id'),
                title: this.model.get('name')
            }],
            buttons: [
                {id:'info', title:'Info'}
            ],
            basepath: this.model.options.basepath,
            format: this.format
        }).extend(this.model);
        if (this.model.get('size')) {
            data.buttons.push({id:'download', title:'Download'});
        }
        $(this.el).html(templates.Map(data));
        this.map = new views.MapClient({model: this.model});
        this.bind('ready', this.map.ready);
        $(this.el).append(this.map.el);
        return this;
    }
});


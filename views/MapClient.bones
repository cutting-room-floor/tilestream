// MapPreview
// ----------
// A web map client for displaying tile-based maps.
view = Backbone.View.extend({
    className: 'MapClient',
    id: 'map',
    initialize: function(options) {
        _.bindAll(this, 'ready');
    },
    ready: function() {
        var mm = com.modestmaps;

        function mmNav() {
            if (!$('.zoom').size()) return;
            $('.zoom.active').removeClass('active');
            $('.zoom-' + map.getZoom()).addClass('active');
        }

        var center = this.model.get('center');
        var tj = this.model.toJSON();
        var map = new mm.Map(this.el,
            new wax.mm.connector(tj)
        ).setCenterZoom(
            new mm.Location(center[1], center[0]
        ), center[2]);
        var layer = map.getLayerAt(0);
        layer.provider.options.tiles = this.model.get('tiles');
        layer.provider.options.minzoom = this.model.get('minzoom');
        layer.provider.options.maxzoom = this.model.get('maxzoom');
        layer.setProvider(layer.provider);

        layer.provider.setZoomRange(layer.provider.options.minzoom,
                              layer.provider.options.maxzoom)

        map.setZoomRange(layer.provider.options.minzoom,
                              layer.provider.options.maxzoom)
        wax.mm.zoomer(map).appendTo(map.parent);
        wax.mm.zoombox(map);
        wax.mm.attribution(map).appendTo(map.parent);

        if (tj.grids) {
            wax.mm.interaction(map, tj);
        }

        map.addCallback('zoomed', mmNav);
        map.addCallback('extentset', mmNav);
        mmNav();

        this.map = map;
    }
});

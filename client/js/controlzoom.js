// ControlZoom
// -----------
// OpenLayers control for updating zoom level indicator.
var ControlZoom = OpenLayers.Class(OpenLayers.Control, {
    CLASS_NAME: 'ControlZoom',
    initialize: function(options) {
        this.options = options || {};
        OpenLayers.Control.prototype.initialize.apply(this, [options || {}]);
    },
    setMap: function(map) {
        OpenLayers.Control.prototype.setMap.apply(this, arguments);
        this.map.events.on({
            "moveend": this.controlZoom,
            "zoomend": this.controlZoom,
            scope: this
        });
    },
    controlZoom: function() {
        var zoom = parseInt(this.options.minzoom) + this.map.getZoom();
        $('.zoom.active').removeClass('active');
        $('.zoom-' + zoom).addClass('active');
    }
});

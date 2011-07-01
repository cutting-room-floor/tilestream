// Tileset
// -------
// A single tileset, corresponding to an `.mbtiles` file. `model.id` is the
// file basename, e.g. `foo.mbtiles` has an `id` of `foo`.
model = Backbone.Model.extend({
    url: function() {
        return this.options.basepath + 'api/Tileset/' + this.id;
    },
    // Get ZXY of tile of tileset's center and minzoom. From [OSM wiki][1].
    // [1]: http://wiki.openstreetmap.org/wiki/Slippy_map_tilenames#lon.2Flat_to_tile_numbers_2
    toZXY: function() {
        var z = this.get('center')[2];
        var lat_rad = this.get('center')[1] * Math.PI / 180 * -1; // -1 for TMS (flipped from OSM)
        var x = parseInt((this.get('center')[0] + 180.0) / 360.0 * Math.pow(2, z));
        var y = parseInt((1.0 - Math.log(Math.tan(lat_rad) + (1 / Math.cos(lat_rad))) / Math.PI) / 2.0 * Math.pow(2, z));
        return [z, x, y];
    },
    thumb: function(zxy) {
        zxy = zxy || this.toZXY();
        return this.get('tiles')[0]
            .replace('${z}', zxy[0])
            .replace('${x}', zxy[1])
            .replace('${y}', zxy[2]);
    },
    wax: function() {
        return {
            api: 'mm',
            layers: [this.get('id')],
            center: this.get('center')
        };
    }
});

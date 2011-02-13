/**
 * The url of the MapBox logo for maps
 * @const
 * @type {string}
 */
var MAPBOX_LOGO = 'http://js.mapbox.com/img/mapbox.png';

OpenLayers.Layer.MapBox = OpenLayers.Class(OpenLayers.Layer.TMS, {
    /*
     * Do not remove the MapBox or OpenStreetMap attribution from this code,
     * doing so is in violation of the terms of both licenses.
     */
    initialize: function (name, options) {
        var newArguments;
        options = OpenLayers.Util.extend({
            attribution: "<a style='background: url(" + MAPBOX_LOGO + "); height: 22px; width: 80px; float: left; clear: left;margin-right: 10px;' href='http://mapbox.com'></a> <span style='vertical-align: middle;'>|</span> <a style='font-family: sans-serif; text-decoration: none; color: #263E55;vertical-align: middle;font-size: 90%;' href='http://mapbox.com/tos'>Terms of Service</a>",
            type: "png",
            /* required for all MapBox maps; these help load tiles correctly */
            /* maxResolution: 156543.0339, */
            serverResolutions: [
              156543.0339,
              78271.51695,
              39135.758475,
              19567.8792375,
              9783.93961875,
              4891.969809375,
              2445.9849046875,
              1222.99245234375,
              611.496226171875,
              305.7481130859375,
              152.87405654296876,
              76.43702827148438,
              38.21851413574219,
              19.109257067871095,
              9.554628533935547,
              4.777314266967774,
              2.388657133483887,
              1.1943285667419434,
              0.5971642833709717],
            units: "m",
            projection: "EPSG:900913",
            numZoomLevels: 19,
            displayOutsideMaxExtent: true,
            wrapDateLine: true,
            /* performance optimization for tile loading from multiple CNAMEs */
            buffer: 0,
            /* customizable per map, this is just the default. set to false for overlays */
            isBaseLayer: true,
            /* customizable per map, set to different bounds to avoid red tiles */
            maxExtent: new OpenLayers.Bounds(-20037508.34, -20037508.34, 20037508.34, 20037508.34)
        }, options);
        if (options.osm) {
          options.attribution = "<a style='background: url(" + MAPBOX_LOGO + "); height: 22px; width: 80px; float: left; clear: left;margin-right: 10px;' href='http://mapbox.com'></a> <span style='vertical-align: middle;'>|</span> <a style='font-family: sans-serif; text-decoration: none; color: #263E55;vertical-align: middle;font-size: 90%;' href='http://mapbox.com/tos'>Terms of Service</a> <span style='font-family: sans-serif; text-decoration: none; color: #263E55;vertical-align: middle;font-size: 90%;'>| Data &copy; OSM CCBYSA</span>";
        }
        newArguments = [name, [
            "http://a.tile.mapbox.com/",
            "http://b.tile.mapbox.com/",
            "http://c.tile.mapbox.com/",
            "http://c.tile.mapbox.com/"
        ], options];
        OpenLayers.Layer.TMS.prototype.initialize.apply(this, newArguments);
    },
    CLASS_NAME: "OpenLayers.Layer.MapBox"
});

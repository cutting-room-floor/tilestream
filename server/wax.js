var _ = require('underscore'),
    Step = require('step'),
    models = require('models'),
    path = require('path');

module.exports = function(app, settings) {
    // Loader for layers. Validates `req.query` to ensure it is usable.
    function load(req, res, next) {
        var valid = (_.isString(req.query.el) &&
            _.isArray(req.query.layers) &&
            _.isArray(req.query.center) &&
            req.query.layers.length > 0 &&
            req.query.center.length === 2);
        if (!valid) return res.send('Invalid request.', 400);

        var layers = [];
        Step(
            function() {
                var group = this.group();
                for (var i = 0; i < req.query.layers.length; i++) {
                    var id = req.query.layers[i];
                    var tileset = new models.Tileset({id: id});
                    var next = group();
                    layers.push(tileset);
                    tileset.fetch({ success: next, error: next });
                }
            },
            function() {
                layers = _.select(layers, function(layer) {
                    return layer.get('name');
                });
                if (layers.length !== req.query.layers.length) {
                    res.send('Invalid layer specified.', 400);
                } else {
                    res.layers = layers;
                    next();
                }
            }
        );
    };

    // OpenLayers Wax API Endpoint
    // ---------------------------
    // Provides and API for generating wax documents based on request query
    // string.
    //
    // Possible query parameters include:
    //
    // - `el` - ID of the DOM element that should be attached to.
    // - `layers` - List of layer IDs to include in the wax file. In front to
    //    back order.
    //     layers[]=test_project&layers[]=broadband-virginia_23ecea
    // - `center` - List containing the longitude and latitude
    //     center[]=66.5&center[]=55.8
    // - `zoom` - Integer for inital zoom level.
    //
    app.get('/wax.json', load, function(req, res, next) {
        var zoom = req.query.zoom || 0;
        var waxedLayers = _.map(res.layers, layerWax);
        var map = {
            "map": {
                "layers": waxedLayers,
                "maxExtent": {
                    "_type": "OpenLayers.Bounds",
                    "_value": [-20037500, -20037500, 20037500, 20037500]
                },
                "maxResolution": 1.40625,
                "projection": {
                    "_type": "OpenLayers.Projection",
                    "_value": ["EPSG:900913"]
                },
                "displayProjection": {
                    "_type": "OpenLayers.Projection",
                    "_value": ["EPSG:900913"]
                },
                "units": "m",
                "controls": [
                {
                    "_type": "OpenLayers.Control.Navigation",
                    "_value": [{
                        "zoomWheelEnabled": true
                    }]
                },
                {
                    "_type": "OpenLayers.Control.Attribution",
                    "_value": [""]
                }
                ]
            },
            "externals": [
                {
                    "_type": "wax.ol.ZoomOnLoad",
                    "_value": [
                        '#' + req.query.el, req.query.center[0], req.query.center[1], zoom
                    ]
                }
            ]
        }
        res.send(map);
    });

    // Generate wax for the provided layer
    // -----------------------------------
    //
    function layerWax(layer) {
        var serverResolutions = [
            156543.0339,78271.51695,39135.758475,19567.8792375,9783.93961875,
            4891.96980938,2445.98490469,1222.99245234,611.496226172,
            305.748113086,152.874056543,76.4370282715,38.2185141357,
            19.1092570679,9.55462853394,4.77731426697,2.38865713348,
            1.19432856674,0.597164283371
        ];

        // Set the layer bounds. If the layer bounds exceed that of the world,
        // do not set `maxExtent` as OpenLayers does not render the contiguous
        // dateline-wrapped world correctly in this scenario.
        var bounds = layer.get('bounds');
        var maxExtent = {
            "_type": "wax.ol.BoundsTransform",
            "_value": bounds.concat(['EPSG:4326', 'EPSG:900913'])
        };

        var wrapDateLine = false;
        if (
            bounds[0] <= -180
            && bounds[2] >= 180
        ) {
            maxExtent = false;
            wrapDateLine = true;
        }

        return {
            '_type': 'OpenLayers.Layer.TMS',
            '_value': [
                layer.get('name'), settings.tile_hostnames,
                {
                    "projection": {
                      "_type": "OpenLayers.Projection",
                      "_value": ["EPSG:900913"]
                    },
                    "wrapDateLine": wrapDateLine,
                    "maxExtent": maxExtent,
                    "type": "png",
                    "buffer": 0,
                    "transitionEffect": 'resize',
                    "serverResolutions": serverResolutions,
                    "layername": layer.id,
                    "isBaseLayer": layer.get('type') === 'baselayer' ? "true" : false,
                    "resolutions": serverResolutions.slice(layer.get('minzoom'), layer.get('maxzoom') + 1),
                    "visibility": true,
                }
            ]
        }
    }
}

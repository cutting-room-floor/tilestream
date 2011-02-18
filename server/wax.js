var _ = require('underscore'),
    Step = require('step'),
    models = require('models-server'),
    path = require('path');

module.exports = function(app, settings) {

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
    // - `externals`
    //
    app.get('/wax.json', function(req, res, next) {
        Step(
            function() {
                var tilesets = new models.TilesetList();
                var that = this;
                tilesets.fetch({
                    success: function(model, resp) { that(null, model); },
                    error: function(model, resp) { res.send(resp, 500); }
                });
            },
            function(err, collection) {
                var zoom = req.query.zoom || 0;

                var layers = _.map(req.query.layers, function(layerId) { return collection.get(layerId) });
                var waxedLayers = _.map(layers, layerWax);

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
                            "_type": "OpenLayersWaxZoomOnLoad",
                            "_value": [
                                '#' + req.query.el, req.query.center[0], req.query.center[1], zoom
                            ]
                        }
                    ]
                }
                // turn on jsonp support in express
                app.enable('jsonp callback');
                res.send(map);
                app.disable('jsonp callback');
            }
        );
    });
}

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
        "_type": "OpenLayersWax.BoundsTransform",
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
            layer.get('name'), 'http://localhost:9000/',
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

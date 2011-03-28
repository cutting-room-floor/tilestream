var _ = require('underscore'),
    Step = require('step'),
    models = require('tilestream/mvc/models'),
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
    // - `minzoom` - Override the minimum zoom level for all layers in the map.
    // - `maxzoom` - Override the maximum zoom level for all layers in the map.
    //
    app.get('/wax.json', load, function(req, res, next) {
        var zoom = req.query.zoom || 0;
        res.send({ 'wax':
            ['@group',
                ['@new OpenLayers.Map',
                    req.query.el,
                    {
                        'layers': _.map(res.layers, layerWax),
                        'units': 'm',
                        'maxResolution': 1.40625,
                        'maxExtent': [
                            '@new OpenLayers.Bounds',
                            -20037508.34,
                            -20037508.34,
                            20037508.34,
                            20037508.34
                        ],
                        'projection': [
                            '@new OpenLayers.Projection',
                            'EPSG:900913'
                        ],
                        'displayProjection': [
                            '@new OpenLayers.Projection',
                            'EPSG:900913'
                        ],
                        'controls': [
                            ['@new OpenLayers.Control.Navigation',
                                {'zoomWheelEnabled': true}
                            ],
                            ['@new OpenLayers.Control.Attribution'],
                            ['@new wax.ol.Interaction'],
                            ['@new wax.ol.Legend']
                        ]
                    }
                ],
                ['@inject setCenter',
                    ['@group',
                        ['@new OpenLayers.LonLat',
                            req.query.center[0],
                            req.query.center[1]
                        ],
                        ['@inject transform',
                            ['@new OpenLayers.Projection', 'EPSG:4326'],
                            ['@new OpenLayers.Projection', 'EPSG:900913']
                        ]
                    ],
                    req.query.zoom || 0
                ]
            ]
        });

        // Generate wax for the provided layer
        function layerWax(layer, index) {
            var minzoom = layer.get('minzoom'),
                maxzoom = layer.get('maxzoom'),
                hostnames = [],
                options = {
                    'projection': ['@new OpenLayers.Projection', 'EPSG:900913'],
                    'wrapDateLine': false,
                    'type': 'png',
                    'buffer': 0,
                    'transitionEffect': 'resize',
                    'serverResolutions': [
                        156543.0339,78271.51695,39135.758475,19567.8792375,9783.93961875,
                        4891.96980938,2445.98490469,1222.99245234,611.496226172,
                        305.748113086,152.874056543,76.4370282715,38.2185141357,
                        19.1092570679,9.55462853394,4.77731426697,2.38865713348,
                        1.19432856674,0.597164283371
                    ],
                    'layername': layer.id,
                    'isBaseLayer': index === 0,
                    'visibility': true,
                    'maxExtent': [
                        '@new OpenLayers.Bounds',
                        -20037508.34,
                        -20037508.34,
                        20037508.34,
                        20037508.34
                    ],
                    'wrapDateLine': false
                };

            // Set the layer bounds. If the layer bounds exceed that of the world,
            // do not set `maxExtent` as OpenLayers does not render the contiguous
            // dateline-wrapped world correctly in this scenario.
            if (layer.get('bounds')[0] <= -180 && layer.get('bounds')[2] >= 180) {
                options.wrapDateLine = true;
            }

            // Return the proper subset of resolutions for this layer, using
            // request query overrides of minzoom/maxzoom if present.
            (req.query.minzoom && req.query.minzoom > minzoom) && (minzoom = req.query.minzoom);
            (req.query.maxzoom && req.query.maxzoom < maxzoom) && (maxzoom = req.query.maxzoom);
            options.resolutions = options.serverResolutions.slice(
                minzoom,
                maxzoom + 1
            );

            // If no hosts specified in settings, try to auto-detect host.
            if (layer.get('type') === 'mapbox') {
                hostnames = [
                    "http://a.tile.mapbox.com/",
                    "http://b.tile.mapbox.com/",
                    "http://c.tile.mapbox.com/"
                ];
                options.isBaseLayer = true;
            } else if (settings.tileHost.length !== 0) {
                hostnames = settings.tileHost;
            } else {
                hostnames.push('http://' + req.headers.host + '/');
            }

            return ['@new OpenLayers.Layer.TMS',
                layer.get('name'),
                hostnames,
                options
            ];
        }
    });
}

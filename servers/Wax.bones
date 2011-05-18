var Step = require('step');

server = Bones.Server.extend({
    initialize: function(app) {
        // Wax API Endpoint
        // ----------------
        // Provides and API for generating wax documents based on request query
        // string.
        //
        // Possible query parameters include:
        //
        // - `el` - ID of the DOM element that should be attached to.
        // - `layers` - List of layer IDs to include in the wax file. In front to
        //    back order.
        //        layers[]=test_project&layers[]=broadband-virginia_23ecea
        // - `center` - List in the form [<lon>, <lat>, <zoom>]
        //        center[]=66.5&center[]=55.8&&center[]=2
        var load = _(this.load).bind(this),
            wax = _(this.sendWax).bind(this);
        this.get('/api/v1/wax.json', load, wax);
        this.get('/api/wax.json', load, wax);
    },
    // Loader for layers. Validates `req.query` to ensure it is usable.
    load: function(req, res, next) {
        // Load defaults from Map model for each query property.
        var properties = ['el', 'api', 'size', 'center', 'options'],
            numeric = ['size', 'center'];
        _(properties).each(_(function(key) {
            req.query[key] = req.query[key] || this.defaults[key];
            req.query[key] = _(req.query[key].toJSON).isFunction()
                ? req.query[key].toJSON()
                : req.query[key];
            if (_(numeric).include(key) && _(req.query[key]).isArray()) {
                req.query[key] = _(req.query[key]).map(function(value) {
                    return parseFloat(value);
                });
            }
        }).bind(this));
        // Exception for `layers`.
        req.query.layers = req.query.layers || [];

        // Validate all query properties.
        var checkOption = function(option) {
            return _(['zoomwheel', 'zoompan', 'legend', 'tooltips']).include(option);
        };
        if (!_(req.query.el).isString()) return res.send('`el` is invalid.', 400);
        if (!_(_(this.Waxer).keys()).include(req.query.api)) return res.send('`api` is invalid.', 400);
        if (!_(req.query.size).isArray()) return res.send('`size` is invalid.', 400);
        if (_(req.query.size).size() !== 2) return res.send('`size` is invalid.', 400);
        if (!_(req.query.size).all(_.isNumber)) return res.send('`size` is invalid.', 400);
        if (!_(req.query.center).isArray()) return res.send('`center` is invalid.', 400);
        if (_(req.query.center).size() !== 3) return res.send('`center` is invalid.', 400);
        if (!_(req.query.center).all(_.isNumber)) return res.send('`center` is invalid.', 400);
        if (!_(req.query.layers).isArray()) return res.send('`layers` is invalid.', 400);
        if (_(req.query.layers).size() === 0) return res.send('`layers` is invalid.', 400);
        if (!_(req.query.options).isArray()) return res.send('`options` is invalid.', 400);
        if (!_(req.query.options).all(checkOption)) return res.send('`options` is invalid.', 400);

        var loadLayer = function(id, callback) {
            (new models.Tileset({ id: id }, req.query)).fetch({
                success: function(model) { callback(null, model) },
                error: function(model, err) { callback(err) }
            });
        };
        Step(
            function() {
                var group = this.group();
                if (!req.query.layers.length) next();
                _.map(req.query.layers, function(id) {
                    loadLayer(id, group());
                });
            },
            function(err, layers) {
                if (err) {
                    next(new Error(err), 400);
                } else {
                    res.layers = layers;
                    next();
                }
            }
        );
    },
    sendWax: function(req, res, next) {
        var hosts = { uiHost: req.query.uiHost, tileHost: req.query.tileHost };
        res.send(this.Waxer[req.query.api].generate(res.layers, req.query, hosts));
    },
    defaults: {
        name: '',
        el: 'map',
        api: 'ol',
        size: [500, 300],
        center: [0, 0, 0],
        layers: [],
        options: ['zoomwheel', 'legend', 'tooltips']
    },
    // Wax generation APIs. Each API object should have a `generate` method
    // that returns a wax JSON record object.
    Waxer: {
        ol: {
            generate: function(layers, params, hosts) {
                return { wax:
                    ['@group',
                        ['@new OpenLayers.Map',
                            params.el,
                            {
                                layers: _(layers).map(this.layerWax(hosts)),
                                units: 'm',
                                maxResolution: 1.40625,
                                theme: hosts.uiHost + 'assets/tilestream/maps/ol/dark.css',
                                maxExtent: [
                                    '@new OpenLayers.Bounds',
                                    -20037508.34,-20037508.34,
                                    20037508.34,20037508.34
                                ],
                                projection: [
                                    '@new OpenLayers.Projection',
                                    'EPSG:900913'
                                ],
                                displayProjection: [
                                    '@new OpenLayers.Projection',
                                    'EPSG:900913'
                                ],
                                controls: this.generateControls(params.options)
                            }
                        ],
                        ['@inject setCenter',
                            ['@group',
                                ['@new OpenLayers.LonLat',
                                    params.center[0], params.center[1]
                                ],
                                ['@inject transform',
                                    ['@new OpenLayers.Projection', 'EPSG:4326'],
                                    ['@new OpenLayers.Projection', 'EPSG:900913']
                                ]
                            ],
                            // OpenLayers sets zoom level relative to the minimum
                            // zoom level of the base layer, e.g. a map with zooms
                            // 3-10 has a zoom level of '0' initially when on zoom
                            // level 3.
                            params.center[2] - layers[0].get('minzoom')
                        ]
                    ]
                };
            },
            layerWax: function(hosts) {
                return function(layer, index) {
                    var options = {
                        'projection': ['@new OpenLayers.Projection', 'EPSG:900913'],
                        'wrapDateLine': false,
                        'type': 'png',
                        'buffer': 0,
                        'transitionEffect': 'resize',
                        'serverResolutions': [
                            156543.0339, 78271.51695, 39135.758475, 19567.8792375,
                            9783.93961875, 4891.96980938, 2445.98490469,
                            1222.99245234, 611.496226172,
                            305.748113086, 152.874056543, 76.4370282715, 38.2185141357,
                            19.1092570679, 9.55462853394, 4.77731426697, 2.38865713348,
                            1.19432856674, 0.597164283371, 0.2985821417, 0.1492910708,
                            0.0746455354, 0.0373227677
                        ],
                        'layername': layer.get('id'),
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

                    // Return the proper subset of resolutions for this layer.
                    options.resolutions = options.serverResolutions.slice(
                        layer.get('minzoom'),
                        layer.get('maxzoom') + 1
                    );

                    return ['@new OpenLayers.Layer.TMS',
                        layer.get('name'),
                        hosts.tileHost,
                        options
                    ];
                }
            },
            generateControls: function(controls) {
                var wax = {
                    zoomwheel: ['@new OpenLayers.Control.Navigation',
                        {'zoomWheelEnabled': true}
                    ],
                    zoomwheelOff: ['@new OpenLayers.Control.Navigation',
                        {'zoomWheelEnabled': false}
                    ],
                    zoompan: ['@new OpenLayers.Control.ZoomPanel'],
                    tooltips: ['@new wax.ol.Interaction'],
                    legend: ['@new wax.ol.Legend']
                };
                _(controls).include('zoomwheel') || controls.unshift('zoomwheelOff');
                return _(controls).map(function(c) { return wax[c]; });
            }
        }
    }
});


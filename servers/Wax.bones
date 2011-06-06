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
        var properties = ['el', 'api', 'center', 'options'],
            numeric = ['size', 'center'];
        _(properties).each(_(function(key) {
            req.query[key] = req.query[key] || this.defaults[key];
            req.query[key] = _(req.query[key].toJSON).isFunction()
                ? req.query[key].toJSON()
                : req.query[key];
        }).bind(this));
        _(numeric).each(_(function(key) {
            if (_(req.query[key]).isArray()) {
                req.query[key] = _(req.query[key]).map(parseFloat);
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
        if (!_(req.query.size).isUndefined()) {
            if (!_(req.query.size).isArray()) return res.send('`size` is invalid.', 400);
            if (_(req.query.size).size() !== 2) return res.send('`size` is invalid.', 400);
            if (!_(req.query.size).all(_.isNumber)) return res.send('`size` is invalid.', 400);
        }
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
        api: 'mm',
        center: [0, 0, 0],
        layers: [],
        options: ['zoomwheel', 'legend', 'tooltips']
    },
    // Wax generation APIs. Each API object should have a `generate` method
    // that returns a wax JSON record object.
    Waxer: {
        mm: {
            generate: function(layers, params, hosts) {
                var layer = layers[0];
                return { wax:
                    ['@group',
                        ['@call w',
                            ['@group',
                                ['@new com.modestmaps.Map',
                                    params.el,
                                    ['@new wax.mm.provider',
                                        {
                                            baseUrl: hosts.tileHost,
                                            layerName: layer.get('id'),
                                            zoomRange: [
                                                layer.get('minzoom'),
                                                layer.get('maxzoom')
                                            ]
                                        }
                                    ],
                                    params.size ? ['@new com.modestmaps.Point'].concat(params.size) : null,
                                    [
                                        ['@new com.modestmaps.MouseHandler'],
                                        ['@new com.modestmaps.TouchHandler']
                                    ]
                                ],
                                ['@inject setCenterZoom',
                                    ['@new com.modestmaps.Location',
                                        params.center[1],
                                        params.center[0]
                                    ],
                                    params.center[2]
                                ]
                            ]
                        ]
                    ].concat(this.generateControls(params.options))
                };
            },
            generateControls: function(controls) {
                var wax = {
                    /*
                    @TODO, see: https://github.com/stamen/modestmaps-js/issues/35
                    zoomwheel: [],
                    zoomwheelOff: [],
                    */
                    zoompan: ['@inject melt', ['@literal wax.mm.zoomer']],
                    tooltips: ['@inject melt', ['@literal wax.mm.interaction']],
                    legend: ['@inject melt', ['@literal wax.mm.legend']]
                };
                _(controls).include('zoomwheel') || controls.unshift('zoomwheelOff');
                return _(controls).map(function(c) { return wax[c]; });
            }
        }
    }
});

server.prototype.Waxer.ol = server.prototype.Waxer.mm;


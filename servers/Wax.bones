var Step = require('step');
var url = require('url');

server = Bones.Server.extend({
    OPTIONS: ['zoomwheel', 'zoompan', 'legend', 'tooltips', 'zoombox', 'attribution'],
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
        var validate = _(this.validate).bind(this),
            load = _(this.load).bind(this),
            wax = _(this.sendWax).bind(this);
        this.get('/api/v1/wax.json', validate, load, wax);
        this.get('/api/wax.json', validate, load, wax);
    },
    // Validates `req.query` to ensure it is usable.
    validate: function(req, res, next) {
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
        var checkOption = _(function(option) {
            return _(this.OPTIONS).include(option);
        }).bind(this);
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
        if (!_(req.query.options).isArray()) return res.send('`options` is invalid.', 400);
        if (!_(req.query.options).all(checkOption)) return res.send('`options` is invalid.', 400);
        return next();
    },
    // Loader for layers.
    load: function(req, res, next) {
        req.query.layers = req.query.layers || [];
        if (!_(req.query.layers).isArray()) return res.send('`layers` is invalid.', 400);
        if (_(req.query.layers).size() === 0) return res.send('`layers` is invalid.', 400);
        var loadLayer = function(id, callback) {
            (new models.Tileset({ id: id }, req.query)).fetch({
                success: function(model) { callback(null, model) },
                error: function(model, err) { callback(err) }
            });
        };
        Step(function() {
            var group = this.group();
            for (var i = 0; i < req.query.layers.length; i++) {
                loadLayer(req.query.layers[i], group());
            }
        },
        function(err, layers) {
            if (err) return next(new Error(err), 400);
            res.layers = layers;
            next();
        });
    },
    sendWax: function(req, res, next) {
        res.send(this.Waxer[req.query.api].generate(res.layers, req.query));
    },
    defaults: {
        name: '',
        el: 'map',
        api: 'mm',
        center: [0, 0, 0],
        layers: [],
        options: ['zoomwheel', 'legend', 'tooltips', 'zoombox', 'attribution']
    },
    // Wax generation APIs. Each API object should have a `generate` method
    // that returns a wax JSON record object.
    Waxer: {
        mm: {
            generate: function(layers, params) {
                var layer = layers[0];
                return { wax:
                    ['@group',
                        ['@call w',
                            ['@group',
                                ['@new com.modestmaps.Map',
                                    params.el,
                                    ['@new wax.mm.connector', layer.attributes],
                                    params.size ? ['@new com.modestmaps.Point'].concat(params.size) : null,
                                    [
                                        ['@new com.modestmaps.DragHandler'],
                                        ['@new com.modestmaps.DoubleClickHandler'],
                                        ['@new com.modestmaps.TouchHandler']
                                    ].concat(
                                        _(params.options).include('zoomwheel')
                                            ? [['@new com.modestmaps.MouseWheelHandler']]
                                            : []
                                    )
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
                    ].concat(this.generateControls(params.options, layer, params))
                };
            },
            generateControls: function(controls, layer, params) {
                var wax = {
                    zoompan: ['@inject melt', ['@literal wax.mm.zoomer']],
                    tooltips: ['@inject melt', ['@literal wax.mm.interaction']],
                    legend: ['@group',
                        ['@call wax.mm.legend', layer.attributes],
                        ['@chain appendTo', params.el]
                    ],
                    zoombox: ['@inject melt', ['@literal wax.mm.zoombox']],
                    attribution: ['@group',
                        ['@call wax.mm.attribution', {attribution: layer.get('attribution')}],
                        ['@chain appendTo', params.el]
                    ]
                };
                return _(controls).map(function(c) { return wax[c]; });
            }
        }
    }
});

server.prototype.Waxer.ol = server.prototype.Waxer.mm;


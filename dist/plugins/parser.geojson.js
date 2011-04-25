T5.Registry.register('parser', 'geojson', function() {
    var FEATURE_TYPE_COLLECTION = 'featurecollection',
        FEATURE_TYPE_FEATURE = 'feature',
        VECTORIZE_OPTIONS = {
            async: false
        },

        DEFAULT_FEATUREDEF = {
            processor: null,
            group: 'shapes',
            layer: 'draw'
        };

    var featureDefinitions = {

        point: _extend({}, DEFAULT_FEATUREDEF, {
            processor: processPoint,
            group: 'markers',
            layer: 'draw'
        }),

        linestring: _extend({}, DEFAULT_FEATUREDEF, {
            processor: processLineString
        }),
        multilinestring: _extend({}, DEFAULT_FEATUREDEF, {
            processor: processMultiLineString
        }),

        polygon: _extend({}, DEFAULT_FEATUREDEF, {
            processor: processPolygon
        }),
        multipolygon: _extend({}, DEFAULT_FEATUREDEF, {
            processor: processMultiPolygon
        })
    };

    /* feature processor utilities */

    function createShape(layer, coordinates, options, builder) {
        var vectors = readVectors(coordinates);
        layer.add(builder(vectors, options));

        return vectors.length;
    } // createShape

    function readVectors(coordinates) {
        var count = coordinates ? coordinates.length : 0,
            positions = new Array(count);

        for (var ii = count; ii--; ) {
            positions[ii] = new Pos(coordinates[ii][1], coordinates[ii][0]);
        } // for

        return PosFns.vectorize(positions, VECTORIZE_OPTIONS);
    } // getLineStringVectors

    /* feature processor functions */

    function processLineString(layer, featureData, options, builders) {
        var vectors = readVectors(featureData && featureData.coordinates ? featureData.coordinates : []);

        return createShape(layer, vectors, options, builders.line);
    } // processLineString

    function processMultiLineString(layer, featureData, options, builders) {
        var coordinates = featureData && featureData.coordinates ? featureData.coordinates : [],
            pointsProcessed = 0;

        for (var ii = coordinates.length; ii--; ) {
            pointsProcessed += createShape(layer, coordinates[ii], options, builders.line);
        } // for

        return pointsProcessed;
    } // processMultiLineString

    function processPoint(layer, featureData, options, builders) {
        var points = readVectors([featureData.coordinates], VECTORIZE_OPTIONS);

        if (points.length > 0) {
            var marker = builders.marker(points[0], options);

            if (marker) {
                layer.add(marker);
                return points.length;
            } // if
        } // if
    } // processPoint

    function processPolygon(layer, featureData, options, builders) {
        var coordinates = featureData && featureData.coordinates ? featureData.coordinates : [];
        if (coordinates.length > 0) {
            return createShape(layer, coordinates[0], options, builders.poly);
        } // if

        return 0;
    } // processPolygon

    function processMultiPolygon(layer, featureData, options, builders) {
        var coordinates = featureData && featureData.coordinates ? featureData.coordinates : [],
            pointsProcessed = 0;

        for (var ii = 0; ii < coordinates.length; ii++) {
            pointsProcessed += createShape(layer, coordinates[ii][0], options, builders.poly);
        } // for

        return pointsProcessed;
    } // processMultiPolygon

    /* define the GeoJSON parser */

    var GeoJSONParser = function(data, callback, options, builders) {
        options = _extend({
            rowPreParse: null,
            simplify: false,
            layerPrefix: 'geojson-'
        }, options);

        builders = _extend({
            marker: function(xy, builderOpts) {
                return regCreate(typeDrawable, 'marker', {
                    xy: xy
                });
            },

            line: function(vectors, builderOpts) {
                return regCreate(typeDrawable, 'line', _extend({
                    points: vectors
                }, options, builderOpts));
            },

            poly: function(vectors, builderOpts) {
                return regCreate(typeDrawable, 'poly', _extend({
                    points: vectors
                }, options, builderOpts));
            }
        }, builders);

        var VECTORS_PER_CYCLE = 500,
            rowPreParse = options.rowPreParse,
            layerPrefix = options.layerPrefix,
            featureIndex = 0,
            totalFeatures = 0,
            childParser = null,
            childCount = 0,
            layers = {};

        if (! data) {
            return;
        } // if

        if (! _is(data, typeArray)) {
            data = [data];
        } // if

        /* parser functions */

        function addFeature(definition, featureInfo) {
            var processor = definition.processor,
                layerId = layerPrefix + definition.group,
                featureOpts = _extend({}, definition, options, {
                    properties: featureInfo.properties
                });

            if (processor) {
                return processor(
                    getLayer(layerId, definition.layerClass),
                    featureInfo.data,
                    featureOpts,
                    builders);
            } // if

            return 0;
        } // addFeature

        function extractFeatureInfo(featureData, properties) {
            var featureType = featureData && featureData.type ? featureData.type.toLowerCase() : null;

            if (featureType && featureType === FEATURE_TYPE_FEATURE) {
                return extractFeatureInfo(featureData.geometry, featureData.properties);
            }
            else {
                return {
                    type: featureType,
                    isCollection: (featureType ? featureType === FEATURE_TYPE_COLLECTION : false),
                    definition: featureDefinitions[featureType],
                    data: featureData,
                    properties: properties ? properties : featureData.properties
                };
            } // if..else
        } // extractFeatureInfo

        function featureToPoly(feature, callback) {
        } // featureToPrimitives

        function getLayer(layerId, layerClass) {
            var layer = layers[layerId];

            if (! layer) {
                layer = new layerClass({
                    id: layerId
                });

                layers[layerId] = layer;
            } // if

            return layer;
        } // getLayer

        function parseComplete(evt) {
            if (callback) {
                callback(layers);
            } // if
        } // parseComplete

        function processData(tickCount) {
            var cycleCount = 0,
                childOpts = _extend({}, options),
                ii = featureIndex;

            tickCount = tickCount ? tickCount : new Date().getTime();

            if (childParser) {
                return;
            }

            for (; ii < totalFeatures; ii++) {
                var featureInfo = extractFeatureInfo(rowPreParse ? rowPreParse(data[ii]) : data[ii]),
                    processedCount = null;

                if (featureInfo.isCollection) {
                    childOpts.layerPrefix = layerPrefix + (childCount++) + '-';

                    childParser = new GeoJSONParser(
                        featureInfo.data.features,
                        function(childLayers) {
                            childParser = null;

                            for (var layerId in childLayers) {
                                layers[layerId] = childLayers[layerId];
                            } // for

                            if (featureIndex >= totalFeatures) {
                                parseComplete();
                            } // if
                        }, childOpts);

                    processedCount += 1;
                }
                else if (featureInfo.definition) {
                    processedCount = addFeature(featureInfo.definition, featureInfo);
                } // if..else

                cycleCount += processedCount ? processedCount : 1;

                if (cycleCount >= VECTORS_PER_CYCLE) {
                    break;
                } // if
            } // for

            featureIndex = ii + 1;

            if (childParser || (featureIndex < totalFeatures)) {
                animFrame(processData);
            }
            else {
                parseComplete();
            }
        } // processData

        /* run the parser */

        totalFeatures = data.length;
        animFrame(processData);
    };

    return {
        parse: function(data, callback, options) {
            return new GeoJSONParser(data, callback, options);
        }
    };
});
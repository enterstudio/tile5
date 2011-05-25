T5.Registry.register('service', 'routing', function() {
    
    function parsePositions(sourceData) {
        var sourceLen = sourceData.length,
            positions = new Array(sourceLen);

        for (var ii = sourceLen; ii--; ) {
            positions[ii] = new GeoJS.Pos(sourceData[ii]);
        } // for

        return positions;
    } // parsePositions
    
    var RouteRequest = function(params) {
        params = T5.ex({
            waypoints: [],
            provideRouteHandle: false,
            distanceUnit: "KM",
            routeQueryType: "RMAN",
            routePreference: "Fastest",
            routeInstructions: true,
            routeGeometry: true
        }, params);
        
        // define the base request
        var parent = new Request(),
            routeHeaderFormatter = T5.formatter('<xls:DetermineRouteRequest provideRouteHandle="{0}" distanceUnit="{1}" routeQueryType="{2}">'),
            waypointFormatter = T5.formatter('<xls:{0}><xls:Position><gml:Point><gml:pos>{1}</gml:pos></gml:Point></xls:Position></xls:{0}>');
        
        function parseInstructions(instructionList) {
            var fnresult = [],
                instructions = instructionList && instructionList.RouteInstruction ? 
                    instructionList.RouteInstruction : [];

            // T5.log("parsing " + instructions.length + " instructions", instructions[0], instructions[1], instructions[2]);
            for (var ii = 0; ii < instructions.length; ii++) {
                // initialise the time and duration for this instruction
                var distance = new GeoJS.Distance(distanceToMeters(instructions[ii].distance)),
                    time = TL.parse(instructions[ii].duration, '8601');
                    
                fnresult.push(new T5.RouteTools.Instruction({
                    position: new GeoJS.Pos(instructions[ii].Point),
                    description: instructions[ii].Instruction,
                    distance: distance,
                    time: time
                }));
            } // for
            

            // T5.log("parsed " + fnresult.length + " instructions", fnresult[0], fnresult[1], fnresult[2]);
            return fnresult;
        } // parseInstructions
        
        // initialise _self
        var _self = T5.ex({}, parent, {
            methodName: "DetermineRoute",
            
            getRequestBody: function() {
                // check that we have some waypoints, if not throw an exception 
                if (params.waypoints.length < 2) {
                    throw new Error("Cannot send RouteRequest, less than 2 waypoints specified");
                } // if
                
                var body = routeHeaderFormatter(params.provideRouteHandle, params.distanceUnit, params.routeQueryType);
                                
                // open the route plan tag
                body += "<xls:RoutePlan>";
                                
                // specify the route preference
                body += "<xls:RoutePreference>" + params.routePreference + "</xls:RoutePreference>";
                
                // open the waypoint list
                body += "<xls:WayPointList>";
                
                // add the waypoints
                for (var ii = 0; ii < params.waypoints.length; ii++) {
                    // determine the appropriate tag to use for the waypoint
                    // as to why this is required, who knows....
                    var tagName = (ii === 0 ? "StartPoint" : (ii === params.waypoints.length-1 ? "EndPoint" : "ViaPoint"));
                    
                    body += waypointFormatter(tagName, params.waypoints[ii].toString());
                }
                
                // close the waypoint list
                body += "</xls:WayPointList>";
                
                // TODO: add the avoid list
                
                // close the route plan tag
                body += "</xls:RoutePlan>";
                
                // add the route instruction request
                if (params.routeInstructions) {
                    body += "<xls:RouteInstructionsRequest rules=\"maneuver-rules\" providePoint=\"true\" />";
                } // if
                
                // add the geometry request
                if (params.routeGeometry) {
                    body += "<xls:RouteGeometryRequest />";
                } // if
                
                // close the route request tag
                body += "</xls:DetermineRouteRequest>";
                return body;
            },
            
            parseResponse: function(response) {
                // T5.log("received route request response:", response);
                
                // create a new route data object and map items 
                return new T5.RouteTools.RouteData({
                    geometry: parsePositions(response.RouteGeometry.LineString.pos),
                    instructions: parseInstructions(response.RouteInstructionsList)
                });
            }
        });
        
        return _self;
    };
    
    /* exports */
    
    function calculate(args, callback, errorCallback) {
        args = T5.ex({
           waypoints: []
        }, args);
        
        // check for the route tools
        if (typeof T5.RouteTools !== 'undefined') {
            // create the geocoding request and execute it
            var request = new RouteRequest(args);
            makeServerRequest(request, function(routeData) {
                if (callback) {
                    callback(routeData);
                } // if
            }, errorCallback);
        }
        else {
            T5.log('Could not generate route, T5.RouteTools plugin not found', 'warn');
        } // if..else
    } // calculate
    
    return {
        calculate: calculate
    };
});
/**
# T5.MarkerLayer
_extends:_ T5.ViewLayer


The T5.MarkerLayer provides a T5.ViewLayer that can be used to display one
or more T5.Annotation on a T5.View.  Most commonly used with a T5.Map (which 
includes a marker layer by default).

## Events

### markerUpdate
This event is triggered when the markers have been updated (new markers added, 
markers cleared, etc)

<pre>
layer.bind('markerUpdate', function(markers) {
});
</pre>

- markers (T5.Annotation[]) - the markers in the marker layer after the update has 
been completed


### markerTap
The markerTap event is triggered when markers have been tapped in the marker layer.
The T5.MarkerLayer listens for `tap` events on itself and when triggered looks for
any markers within a tapExtent and if found fires the markerTap event.

<pre>
layer.bind('markerTap', function(absXY, relXY, markers) {
});
</pre>

- absXY (T5.Vector) - the absolute tap position (as per T5.ViewLayer)
- relXY (T5.Vector) - the relative tap position (as per T5.ViewLayer)
- markers (T5.Annotation[]) - an array of the markers that have been _hit_ in the last tap


## Methods
*/
var MarkerLayer = function(params) {
    params = COG.extend({
        zindex: 100,
        style: 'basic'
    }, params);
    
    var markers = [];
        
    /* event handlers */
        
    function handleTap(evt, absXY, relXY, gridXY) {
        var tappedMarkers = [],
            testX = gridXY.x,
            testY = gridXY.y;
            
        // iterate through the markers and look for matches
        for (var ii = markers.length; ii--; ) {
            if (markers[ii].hitTest(testX, testY)) {
                tappedMarkers[tappedMarkers.length] = markers[ii];
            } // if
        } // for
        
        // COG.info('testing for tapped markers, tap count = ' + tappedMarkers.length);
        
        // if we have tapped markers, then cancel the tap event
        if (tappedMarkers.length > 0) {
            evt.cancel = self.trigger('markerTap', absXY, relXY, tappedMarkers).cancel;
        } // if
    } // handleTap
    
    /* internal functions */
    
    /*
    This function is used to provide updates when the markers have changed. This 
    involves informing other waking the parent view and having a redraw occur and 
    additionally, firing the markers changed event
    */
    function markerUpdate() {
        // resync the markers
        resyncMarkers();
        
        // wake and invalidate the parent
        self.changed();
        
        // trigger the markers changed event
        self.trigger('markerUpdate', markers);
    } // markerUpdate
    
    function resyncMarkers() {
        var parent = self.getParent();
        if (parent && parent.syncXY) {
            // iterate through the markers and fire the callback
            for (var ii = markers.length; ii--; ) {
                parent.syncXY([markers[ii].xy]);
            } // for
        } // if
    } // resyncMarkers
    
    /* exports */
    
    /**
    ### add(items)
    The add method of the marker layer can accept either a single T5.Annotation to 
    add to the layer or alternatively an array of annotations to add.
    
    #### Example Usage
    ~ // adding a single marker 
    ~ layer.add(new T5.Marker({
    ~     xy: T5.GeoXY.init(markerPos) // markerPos is a T5.Geo.Position
    ~ }));
    ~ 
    ~ // adding multiple markers
    ~ var markers = [];
    ~ 
    ~ // you would populate the markers array here...
    ~ 
    ~ // add the markers to the layer
    ~ layer.add(markers);
    */
    function add(newItems) {
        // if annotation is an array, then iterate through and add them
        if (newItems && (typeof newItems.length !== 'undefined')) {
            for (var ii = newItems.length; ii--; ) {
                if (newItems[ii]) {
                    markers[markers.length] = newItems[ii];
                } // if
            } // for
        }
        else if (newItems) {
            markers[markers.length] = newItems;
        } // if..else
        
        markerUpdate();
    } // add
    
    /**
    ### clear(testCallback)
    The clear method is used to clear markers from the marker layer.  The optional
    `testCallback` argument can be specified to determine whether a marker should be 
    removed or not.
    
    #### Example Usage
    ~ layer.clear(function(marker) {
    ~     // check an arbitrary property of the annotation
    ~     // if Australia, then flag for removal
    ~     return (marker.country === 'Australia');
    ~ });
    */
    function clear(testCallback) {
        // if we have a test callback, then iterate through the markers and 
        // only remove ones that match the requirements
        if (testCallback) {
            var ii = 0;
            while (ii < markers.length) {
                if (testCallback(markers[ii])) {
                    markers.splice(ii, 1);
                }
                else {
                    ii += 1;
                } // if..else
            } // while
        }
        // otherwise, reset the markers
        else {
            markers = [];
        } // if..else
        
        markerUpdate();
    } // clear
    
    /**
    ### each(callback)
    Iterate through each of the markers and fire the callback for each one
    */
    function each(callback) {
        if (callback) {
            for (var ii = markers.length; ii--; ) {
                callback(markers[ii]);
            } // for
        } // if
    } // each
    
    /** 
    ### find(testCallback)
    Find markers that match the requirements of the test callback.  For an example
    of test callback usage see the `clear` method.
    */
    function find(testCallback) {
        var results = [];
        
        // if we have a test callback, then run
        for (var ii = markers.length; ii--; ) {
            if ((! testCallback) || testCallback(markers[ii])) {
                results[results.length] = markers[ii];
            } // if
        } // for
        
        
        return results;
    } // find
    
    function hitTest(offsetX, offsetY, state, view) {
        var hitMarkers = [];
            
        // iterate through the markers and look for matches
        for (var ii = markers.length; ii--; ) {
            if (markers[ii].hitTest(offsetX, offsetY)) {
                hitMarkers[hitMarkers.length] = {
                    type: 'marker',
                    data: markers[ii]
                };
            } // if
        } // for
        
        return hitMarkers;
    } // hitTest

    // create the view layer the we will draw the view
    var self = COG.extend(new ViewLayer(params), {
        draw: function(context, viewRect, state, view) {
            // iterate through the markers and draw them
            for (var ii = markers.length; ii--; ) {
                markers[ii].draw(
                    context, 
                    viewRect, 
                    state, 
                    self, 
                    view);
            } // for
        },
        
        add: add,
        clear: clear,
        each: each,
        find: find,
        hitTest: hitTest
    });
    
    // handle tap events
    self.bind('tap', handleTap);
    self.bind('parentChange', resyncMarkers);
    self.bind('resync', resyncMarkers);
    
    return self;
};

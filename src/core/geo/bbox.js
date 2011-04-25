/**
# T5.BBox
*/
function BBox(p1, p2) {
    // if p1 is an array, then calculate the bounding box for the positions supplied
    if (_is(p1, typeArray)) {
        var padding = p2,
            minPos = this.min = new Pos(MAX_LAT, MAX_LON),
            maxPos = this.max = new Pos(MIN_LAT, MIN_LON);

        for (var ii = p1.length; ii--; ) {
            var testPos = p1[ii];
            
            if (testPos.lat < minPos.lat) {
                minPos.lat = testPos.lat;
            } // if
            
            if (testPos.lat > maxPos.lat) {
                maxPos.lat = testPos.lat;
            } // if
            
            if (testPos.lon < minPos.lon) {
                minPos.lon = testPos.lon;
            } // if
            
            if (testPos.lon > maxPos.lon) {
                maxPos.lon = testPos.lon;
            } // if
        } // for

        // expand the bounds to give us some padding
        if (_is(padding, typeUndefined)) {
            var size = calcSize(bounds.min, bounds.max);

            // update padding to be a third of the max size
            padding = max(size.x, size.y) * 0.3;
        } // if

        this.expand(padding);
    }
    // otherwise, assign p1 to the min pos and p2 to the max
    else {
        this.min = p1;
        this.max = p2;
    } // if..else
} // BoundingBox

BBox.prototype = {
    constructor: BBox,
    
    /**
    ### bestZoomLevel(viewport)
    */
    bestZoomLevel: function(viewport) {
        // get the constant index for the center of the bounds
        var boundsCenter = this.center(),
            maxZoom = 1000,
            variabilityIndex = min(round(abs(boundsCenter.lat) * 0.05), LAT_VARIABILITIES.length),
            variability = LAT_VARIABILITIES[variabilityIndex],
            delta = this.size(),
            // interestingly, the original article had the variability included, when in actual reality it isn't, 
            // however a constant value is required. must find out exactly what it is.  At present, though this
            // works fine.
            bestZoomH = ceil(log(LAT_VARIABILITIES[3] * viewport.h / delta.y) / log(2)),
            bestZoomW = ceil(log(variability * viewport.w / delta.x) / log(2));

        // _log("constant index for bbox: " + bounds + " (center = " + boundsCenter + ") is " + variabilityIndex);
        // _log("distances  = " + delta);
        // _log("optimal zoom levels: height = " + bestZoomH + ", width = " + bestZoomW);

        // return the lower of the two zoom levels
        return min(isNaN(bestZoomH) ? maxZoom : bestZoomH, isNaN(bestZoomW) ? maxZoom : bestZoomW);
    },

    /**
    ### center()
    */
    center: function() {
        // calculate the bounds size
        var size = this.size();
        
        // create a new position offset from the current min
        return new Pos(this.min.lat + (size.y >> 1), this.min.lon + (size.x >> 1));
    },
    
    /**
    ### expand(amount)
    */
    expand: function(amount) {
        this.min.lat -= amount;
        this.max.lat += amount;
        this.min.lon -= amount % 360;
        this.max.lon += amount % 360;
    },
    
    /**
    ### size(normalize)
    */
    size: function(normalize) {
        var size = new XY(0, this.max.lat - this.min.lat);
        
        if ((normalize || isType(normalize, typeUndefined)) && (this.min.lon > this.max.lon)) {
            size.x = 360 - this.min.lon + this.max.lon;
        }
        else {
            size.x = this.max.lon - this.min.lon;
        } // if..else

        return size;        
    },
    
    /**
    ### toString()
    */
    toString: function() {
        return "min: " + this.min + ", max: " + this.max;
    }
};
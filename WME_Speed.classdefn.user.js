var WME_SPEED_UNKNOWN = -987;

var FRONT_ABBREVS = ["S", "N", "E", "W"]
var END_ABBREVS = ["Ave", "Blvd", "Cir", "Ct", "Dr", "Hts", "Ln", "Loop", "Pkwy", "Pl", "Rd", "Rdge", "Rte", "St", "Trl", "Way"]
var InterstateRegEx = /^I-\d\d\d? /;

function SelectSection(hdr, iD, slctns) {
    this.header = hdr;
    this.id = iD;
    this.selections = slctns;
}

function hasRestrictions(segmentAttr) {
	return ((segmentAttr.fwdRestrictions != null && segmentAttr.fwdRestrictions.length > 0)
        || (segmentAttr.revRestrictions != null && segmentAttr.revRestrictions.length > 0))
}

function getId(name) { return document.getElementById(name); }

function roadTypeToString(roadType) {
    switch(roadType) {
        case 1: return "Street"
        case 2: return "Primary Street"
        case 3: return  "Freeway"
        case 4: return  "Ramps"
        case 5: return  "Walking Trail"
        case 6: return  "Major Highway"
        case 7: return  "Minor Highway"
        case 8: return  "Dirt road"
        case 10: return  "Pedestrian Bw"
        case 16: return  "Stairway"
        case 17: return  "Private Road"
        case 18: return  "Railroad"
        case 19: return  "Runway/Taxiway"
        case 20: return  "Parking Lot Road"
        case 21: return  "Service Road"
        default:
            return "Unknown";
    }
}

function isTrafficRelevant(roadType) {
    switch(roadType) {
        //"Streets"
        case 1:
        //"Primary Street"
        case 2:
        //"Freeways",
        case 3:
        //"Ramps",
        case 4:
        //"Major Highway",
        case 6:
        //"Minor Highway",
        case 7:
        //"Service Road"
        case 21:
            return true;
        default:
            return false;
    }
}

function isOneWay(segment) {
    return ((segment.attributes.fwdDirection + segment.attributes.revDirection) == 1);
}

function isNoDirection(segment) {
    return ((segment.attributes.fwdDirection + segment.attributes.revDirection) == 0);
}

function isInterstate(segment) {
    var sid = segment.attributes.primaryStreetID;
    if(sid) {
        var street = Waze.model.streets.get(sid);
        var streetName = street.name; 
        if(streetName == null || streetName == "") {
            return false;
        }
        return segment.attributes.roadType == 3 && streetName.match(InterstateRegEx) != null;
    }
    return false;
}

function getSegmentSpeed(segment) {
    var speedToUse = 0;
    if(typeof segment.attributes.fwdDirection === "undefined") {
        speedToUse = "NA"
    }
    else {
        var oneWay = isOneWay(segment);
        if (oneWay && segment.attributes.fwdDirection) {
            speedToUse = segment.attributes.fwdCrossSpeed;
        } else if (oneWay && segment.attributes.revDirection) {
            speedToUse = segment.attributes.revCrossSpeed;
        } else {
            // take average?  we could do a max, or a min, or ...
            speedToUse = (segment.attributes.revCrossSpeed + segment.attributes.fwdCrossSpeed) / 2;
        }
        if (!isNaN(speedToUse)) {
            speedToUse *= 0.621;
            // convert from km/h to MPH
            speedToUse = Math.ceil(speedToUse / 5) * 5;
            // round up to the nearest 5 mph
            speedToUse = Math.round(speedToUse);
            // may not be necessary
        }
    }
    return speedToUse;
}

// CLASS DEFINITIONS
function LineBearing(dist, bear) {
    this.distance = dist;
    this.bearing = bear;
}

function getDistance(p1, p2) {

    var y1 = p1.y;
    var x1 = p1.x;

    var y2 = p2.y;
    var x2 = p2.x;

    var dLat = y2 - y1;
    var dLon = x2 - x1;
    var d = Math.sqrt(Math.pow(dLat, 2) + Math.pow(dLon, 2));

    // http://mathforum.org/library/drmath/view/55417.html
    var bearing = 0;
    if (dLon > 0) {
        if (dLat > 0) {
            bearing = calcTan(dLon, dLat);
        }
        if (dLat < 0) {
            bearing = 180 - calcTan(-1 * dLon, dLat);
        }
        if (dLat == 0) {
            bearing = 90;
        }
    }
    if (dLon < 0) {
        if (dLat > 0) {
            bearing = -1 * calcTan(-1 * dLon, dLat);
        }
        if (dLat < 0) {
            bearing = calcTan(dLon, dLat) - 180;
        }
        if (dLat == 0) {
            bearing = 270;
        }
    }
    if (dLon == 0) {
        if (dLat > 0) {
            bearing = 0;
        }
        if (dLat < 0) {
            bearing = 180;
        }
        if (dLat == 0) {
            bearing = 0;
        }
    }
    bearing += 360;
    bearing = bearing % 360;

    return new LineBearing(d, bearing);

}

function getComponentsProperties(comps) {
    var compSegs = [];
    for (var i = 1; i < comps.length; i++) {
        var p1 = compToPoint(comps[i - 1]);
        var p2 = compToPoint(comps[i]);
        var dist = getDistance(p1, p2);
        compSegs.push(dist);
    }
    return compSegs;
}

function Point(x, y) {
    this.x = x;
    this.y = y;
}

function compToPoint(comp) {
    return new Point(comp.x, comp.y);
}

Point.prototype.getLineTo = function(p2) {
    var lat1 = this.latitude;
    var lon1 = this.longitude;

    var lat2 = p2.latitude;
    var lon2 = p2.longitude;

    var dLat = lat2 - lat1;
    var dLon = lon2 - lon1;
    var d = Math.sqrt(Math.pow(dLat, 2) + Math.pow(dLon, 2));

    var bearing = 0;
    // North / South
    if (dLon == 0) {
        bearing = dLat < 0 ? 180 : 0;
    } else {
        bearing = (Math.tan(dLat / dLon) / (2 * Math.PI)) * 360;
    }
    //    return new LineBearing(d, bearing);
}
function WazeLineSegment(segment, street) {
    this.cityID = street.cityID;
    var city = Waze.model.cities.get(this.cityID);
    this.geometry = segment.geometry;
    this.attributes = segment.attributes;
    this.line = getId(segment.geometry.id);
    this.streetName = null;
    this.noName = street.isEmpty;
    this.noCity = city == null || city.isEmpty;
    this.state = this.noCity ? null : Waze.model.states.get(city.stateID);
    this.oneWay = ((this.attributes.fwdDirection + this.attributes.revDirection) == 1);
    // it is 1-way only if either is true
    this.noDirection = (!this.attributes.fwdDirection && !this.attributes.revDirection);
    // Could use the .attribute.allowNoDirection?
    this.updatedOn = new Date(this.attributes.updatedOn);
    this.updatedBy = this.attributes.updatedBy;
    this.fwdSpeed = Math.abs(this.attributes.fwdCrossSpeed);
    this.revSpeed = Math.abs(this.attributes.revCrossSpeed);
    this.length = this.attributes.length;
    this.roadType = this.attributes.roadType;
    this.segment = segment;
}

WazeLineSegment.prototype.getStreetName = function() {

    if (!this.streetName) {
        var sid = this.segment.attributes.primaryStreetID;
        var street = Waze.model.streets.get(sid);
        if (sid && street.name !== null) {
            this.streetName = street.name;
        } else {
            this.streetName = "";
        }
    }
    return this.streetName;
};

function WazeNode(wazeNode, attachedSegments) {
}

function WMEFunction(acheckboxId, aText) {
    this.checkboxId = acheckboxId;
    this.text = aText;
}

WMEFunction.prototype.getCheckboxId = function() {
    return this.checkboxId;
};
WMEFunction.prototype.getBackground = function() {
    return '#fff';
};

WMEFunction.prototype.build = function(checkValue) {
    var checkStr = checkValue ? "checked" : "";
    return '<input style="" type="checkbox" id="' + this.getCheckboxId() + '" ' + checkStr + '/> ' + this.text;
};
WMEFunction.prototype.init = function() {
    console.log("init");
    getId(this.getCheckboxId()).onclick = highlightAllSegments;
};
WMEFunction.prototype.getModifiedAttrs = function(wazeLineSegment) {
    return new Object();
};

WMEFunction.prototype.getDetail = function(wazeLineSegment) {
   return;
};

function WMEFunctionExtended(acheckboxId, aText) {
    WMEFunction.call(this, acheckboxId, aText);
}

extend(WMEFunctionExtended.prototype, WMEFunction.prototype);

WMEFunctionExtended.prototype.getSelectId = function() {
    return this.getCheckboxId() + 'Select';
}

WMEFunctionExtended.prototype.buildExtended = function() {
    return '';
}

WMEFunctionExtended.prototype.build = function(checkValue) {
    return WMEFunction.prototype.build.call(this, checkValue) + '<br />' + this.buildExtended();
};

WMEFunctionExtended.prototype.getSelectFieldChangeFunction = function() {
    var that = this;
    return function() {
        getId(that.getCheckboxId()).checked = "checked";
        highlightSegments();
    };
};

function EventPublisher() {
    this.subscribers = [];
}

EventPublisher.prototype = {
    subscribe : function(fn) {
        this.subscribers.push(fn);
    },
    unsubscribe : function(fn) {
    },
    post : function(thisObj) {
        for (var i = 0, j = this.subscribers.length; i < j; i++) {
            this.subscribers[i].call(thisObj);
        };
    }
};

function HighlightSegmentMonitor() {
    var eventPublisher = new EventPublisher();
    var latestSegment = null;
    this.subscribe = function(fn) {
        eventPublisher.subscribe(fn);
    }
    this.updateLatestSegment = function(latest) {
        latestSegment = latest;
        eventPublisher.post(latest);
    }
    this.getLatestSegment = function() {
        return latestSegment;
    }
}

var highlightSegmentMonitor = new HighlightSegmentMonitor();


W = W || {};

var DEBUG = true;

function debug(message) {
    if (DEBUG) {
        if (typeof(console) !== 'undefined') {
            console.log("co## " + message + " ##");
        } else if (typeof(unsafeWindow) !== 'undefined') {
            unsafeWindow.console.log("us## " + message + " ##");
        } else if (typeof(window) !== 'undefined') {
            window.console.log("wc## " + message + " ##");
        } else if (typeof(GM_log) !== 'undefined') {
            GM_log("gm## " + message + " ##");
        } else {
//            debugger;
        }
    }
}

var WME_SPEED_UNKNOWN = -987;

var FRONT_ABBREVS = ["S", "N", "E", "W"]
var END_ABBREVS = ["Ave", "Blvd", "Cir", "Cres", "Cswy", "Ct", "Dr", "Hts", "Ln", "Loop", "Pkwy", "Pl", "Plz", "Rd", "Rdge", "Rte", "St", "Ter", "Trl", "Way"]
var InterstateRegEx = /^I-\d\d\d? /;

var DEFAULT_OPACITY = 0.5;

var ERROR_RGBA = 'rgba(187,0,0,0.7)'
var ERROR_MODS = {color: "#B00", opacity: DEFAULT_OPACITY, width : 15 };

var MODOBJ_ERROR_RGBA = 'rgba(187,0,0,0.7)'
var MODOBJ_ERROR_MODS = {color: "#B00", opacity: DEFAULT_OPACITY, width :15 };
var MODOBJ_WARN_RGBA = 'rgba(255,17,170,0.7)'
var MODOBJ_WARN_MODS = {color: "#FF11AA", opacity: DEFAULT_OPACITY, width : 15 };
var MODOBJ_MINOR_RGBA = 'rgba(255,208,0,0.5)'
var MODOBJ_MINOR_MODS = {color: "#FC0", opacity: DEFAULT_OPACITY, width : 15 };
var MODOBJ_INFO_RGBA = 'rgba(255,17,170,0.7)'
var MODOBJ_INFO_MODS = {color: "#FF11AA", opacity: DEFAULT_OPACITY * 0.8, width : 15 };

var PRIORITY_INFO = 1;
var PRIORITY_MINOR = 3;
var PRIORITY_WARN = 5;
var PRIORITY_ERROR = 7;

function getSegmentId(segment) {
    // return segment.fid;
    return segment.attributes.id;
}

function SelectSection(hdr, iD, slctns) {
    this.header = hdr;
    this.id = iD;
    this.selections = slctns;
}

function hasRestrictions(segmentAttr) {
	return ((segmentAttr.fwdRestrictions != null && segmentAttr.fwdRestrictions.length > 0)
        || (segmentAttr.revRestrictions != null && segmentAttr.revRestrictions.length > 0))
}

function levelToString(level) {
	return level == 0 ? "Ground" : level;
}

function getId(name) { return document.getElementById(name); }

function roadTypeToString(roadType) {
    switch(roadType) {
        case 1: return "Local Street"
        case 2: return "Primary Street"
        case 3: return "Freeway"
        case 4: return "Ramps"
        case 5: return "Walking Trail"
        case 6: return "Major Highway"
        case 7: return "Minor Highway"
        case 8: return "Unpaved"
        case 10: return "Pedestrian Bw"
        case 15: return "Ferry"
        case 16: return "Stairway"
        case 17: return "Private Road"
        case 18: return "Railroad"
        case 19: return "Runway/Taxiway"
        case 20: return "Parking Lot Road"
        case 21: return "Service Road"
        default: return "Unknown";
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

function isSpeedDataRelevant(wazeLineSegment) {
    if(wazeLineSegment.isRoundAbout()) {
        return false;
    }
    switch(wazeLineSegment.attributes.roadType) {
        //"Streets"
        case 1:
        //"Primary Street"
        case 2:
        //"Freeways",
        case 3:
        //"Major Highway",
        case 6:
        //"Minor Highway",
        case 7:
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
        var street = W.model.streets.get(sid);
        var streetName = street.name; 
        if(streetName == null || streetName == "") {
            return false;
        }
        return segment.attributes.roadType == 3 && streetName.match(InterstateRegEx) != null;
    }
    return false;
}
function getSegmentSpeedLimit(segment)
{
    var speedToUse = 0;
    if(typeof segment.attributes.fwdMaxSpeed === "undefined") {
        speedToUse = "NA"
    }
    else {
        var oneWay = isOneWay(segment);
        if (oneWay && segment.attributes.fwdDirection) {
            speedToUse = segment.attributes.fwdMaxSpeed;
        } else if (oneWay && segment.attributes.revDirection) {
            speedToUse = segment.attributes.revMaxSpeed;
        } else {
            // take average?  we could do a max, or a min, or ...
            speedToUse = (segment.attributes.fwdMaxSpeed + segment.attributes.revMaxSpeed) / 2;
        }
        if (!isNaN(speedToUse) && speedToUse > 0) {
            // convert from km/h to MPH
            speedToUse *= 0.621;
            // round up to the nearest 5 mph
//            speedToUse = Math.round(speedToUse / 5) * 5;
            speedToUse = Math.round(speedToUse);
            // may not be necessary
        } else { speedToUse = undefined }
        
    }
    return speedToUse;
}

function isSameSpeedLimitBothDirections(segment)
{
    var speedToUse = 0;
    if(typeof segment.attributes.fwdMaxSpeed === "undefined") {
        return true;
    }
    if( isOneWay(segment)) { return true; }
    var fwdSpeed = segment.attributes.fwdMaxSpeed;
    var revSpeed = segment.attributes.revMaxSpeed;
    return fwdSpeed == revSpeed;
}

function isSpeedLimitFullySet(segment) {
    if(typeof segment.attributes.fwdMaxSpeed === "undefined") {
        return false
    }
    else {
        var oneWay = isOneWay(segment);
        if (oneWay && segment.attributes.fwdDirection) {
            return segment.attributes.fwdMaxSpeed != null && !isNaN(segment.attributes.fwdMaxSpeed);
        } else if (oneWay && segment.attributes.revDirection) {
            return segment.attributes.revMaxSpeed != null && !isNaN(segment.attributes.revMaxSpeed);
        } else {
            return (segment.attributes.fwdMaxSpeed != null && !isNaN(segment.attributes.fwdMaxSpeed)) && 
                (segment.attributes.revMaxSpeed != null && !isNaN(segment.attributes.revMaxSpeed));
        }
    }
    return false;
}

function isSpeedLimitVerified(segment) {
    var verified = true;
    if(typeof segment.attributes.fwdMaxSpeed === "undefined") {
        verified = false
    }
    else {
        var oneWay = isOneWay(segment);
        if (oneWay && segment.attributes.fwdDirection) {
            verified = !segment.attributes.fwdMaxSpeedUnverified;
        } else if (oneWay && segment.attributes.revDirection) {
            verified = !segment.attributes.revMaxSpeedUnverified;
        } else {
            verified = !segment.attributes.fwdMaxSpeedUnverified && !segment.attributes.revMaxSpeedUnverified;
        }
    }
    return verified;
}

function getSegmentSpeedLimit2(segment)
{
    var speedToUse = [];
    if (segment.attributes.fwdDirection) {
        speedToUse.push(segment.attributes.fwdMaxSpeed);
    } 
    if (segment.attributes.revDirection) {
        speedToUse.push(segment.attributes.revMaxSpeed);
    }
    return speedToUse;
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
function WazeStreet(streetId) {
    var street = W.model.streets.get(streetId);
	var streetDefined = typeof street !== "undefined"
	if(streetDefined) {
		this.cityID = street.cityID;
		var city = W.model.cities.get(this.cityID);
		this.noCity = city == null || city.attributes.isEmpty;
		this.noName = street.isEmpty;
		this.state = this.noCity ? null : W.model.states.get(city.stateID);
	} else {
		this.cityID = -1;
		this.noCity = true;
		this.noName = true;
		this.state = null;
	}
}



function WazeNode(nodeId) {
  this.id = nodeId;
  this.Node = W.model.nodes.objects[nodeId];
  if(typeof this.Node === "undefined") { this.Node = null; }
  this.attributes = this.Node != null ? this.Node.attributes : null;
  this.connectionsImpl = [];
}

WazeNode.prototype.getConnectedSegments = function() {
  if(this.connectionsImpl.length == 0 && this.attributes != null) {
    for(var i = 0; i< this.attributes.segIDs.length; i++) {
        var wazeSeg = SegmentManager.getFromId(this.attributes.segIDs[i])
        if(wazeSeg != null) {
            this.connectionsImpl[this.connectionsImpl.length] = wazeSeg;
        }
    }
  }
  return this.connectionsImpl;
};

WazeNode.prototype.isLoaded = function() {
	return this.Node != null;
};

WazeNode.prototype.UTurnAllowed = function(segmentId) {
    if(this.Node == null) return false;
    var connections = this.Node.attributes.connections[segmentId + "," + segmentId];
    return (typeof connections !== "undefined");
};

WazeNode.prototype.isDeadEnd = function() {
    if(this.Node == null) return true;
//	console.log("" + this.attributes.segIDs.length);
    return this.attributes.segIDs.length < 2;
};

var NodeManager = (function () {

    var cache = { };

    // public sections
    return {
        get: function (nodeId) {
            if(cache[nodeId]) {
                return cache[nodeId];
            }
            var newNode = new WazeNode(nodeId) 
            cache[nodeId] = newNode;
            return newNode;
        },
        clear: function() {
            cache = {};
        }
    }
} ());



function WazeLineSegment(segment) {
    // this.id = segment.fid;
    this.id = getSegmentId(segment);
    this.geometry = segment.geometry;
    this.attributes = segment.attributes;
    var primStrId = this.attributes.primaryStreetID;
    this.primaryStreetInfo = new WazeStreet(primStrId);
    this.ToNode   = this.attributes.toNodeID   ? NodeManager.get(this.attributes.toNodeID)   : null;
    this.FromNode = this.attributes.fromNodeID ? NodeManager.get(this.attributes.fromNodeID) : null;
    this.secondaryStreetInfos = [];
    if(this.attributes.streetIDs) {
        for(var secStrIdx = 0; secStrIdx < this.attributes.streetIDs.length; secStrIdx++) {
            this.secondaryStreetInfos[secStrIdx] = new WazeStreet(this.attributes.streetIDs[secStrIdx]);
        }
    }
    this.cityID = this.primaryStreetInfo.cityID;
    this.line = getId(segment.geometry.id);
    this.streetName = null;
    this.streetState = null;
    this.noName = this.primaryStreetInfo.noName;
    this.noCity = this.primaryStreetInfo.noCity;
    this.state = this.primaryStreetInfo.state;
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
//    this.unpaved = segment.flagAttributes.unpaved;
    this.unpaved = (segment.attributes.flags & 0x10) != 0;
}

WazeLineSegment.prototype.getStreetName = function() {

    if (!this.streetName) {
        var sid = this.segment.attributes.primaryStreetID;
        var street = W.model.streets.get(sid);
        if (sid && street.name !== null) {
            this.streetName = street.name;
        } else {
            this.streetName = "";
        }
    }
    return this.streetName;
};

WazeLineSegment.prototype.isRoundAbout = function () {
	return this.attributes.junctionID != null;
};

WazeLineSegment.prototype.isDisconnected = function() {
//    var toNodeAttached = this.ToNode != null && (!this.ToNode.isDeadEnd() || !this.ToNode.isLoaded());
    var toNodeAttached = this.ToNode != null && !this.ToNode.isDeadEnd();
//    var fromNodeAttached = this.FromNode != null && (!this.FromNode.isDeadEnd() || !this.FromNode.isLoaded()); 
    var fromNodeAttached = this.FromNode != null && !this.FromNode.isDeadEnd(); 
//	console.log("fromNodeAttached  = " + fromNodeAttached + " and toNodeAttached = " + toNodeAttached);
	// console.log("FromNode  = " + this.FromNode.attributes.segIDs.length);
    return !toNodeAttached && !fromNodeAttached;
};

WazeLineSegment.prototype.isTrafficRelevant = function() {
    return isTrafficRelevant(this.attributes.roadType);
};

WazeLineSegment.prototype.hasExpiredRestrictions = function() {
    if(this.attributes.fwdRestrictions != null) {
		for(var i = 0; i < this.attributes.fwdRestrictions.length; i++) {
			if(this.attributes.fwdRestrictions[0].isInThePast()) { return true; }
		}
	}
    if(this.attributes.revRestrictions != null) {
		for(var i = 0; i < this.attributes.revRestrictions.length; i++) {
			if(this.attributes.revRestrictions[0].isInThePast()) { return true; }
		}
	}
	return false;
};

WazeLineSegment.prototype.isIsolated = function() {
if(false) {
    var toNodeConnections = this.ToNode == null ? [] : this.ToNode.getConnectedSegments();
    var toNodeCount = 0;
    for(var i = 0; i < toNodeConnections.length; i++) {
        if(toNodeConnections[i].id != this.id) { toNodeCount++ }
    }
    var fromNodeConnections = this.FromNode == null ? [] : this.FromNode.getConnectedSegments();
    var fromNodeCount = 0;
    for(var i = 0; i < fromNodeConnections.length; i++) {
        if(fromNodeConnections[i].id != this.id) { fromNodeCount++ }
    }
    return fromNodeCount == 0 && toNodeCount == 0;
    } else { return false; }
};

WazeLineSegment.prototype.containsUTurn = function() {
    return this.ToNode.UTurnAllowed(this.id) || this.FromNode.UTurnAllowed(this.id);
};
WazeLineSegment.prototype.hasHardConnectionTo = function(segment) {
    if(false) {
        var connections = this.ToNode.getConnectedSegments();
        for(var i = 0; i < connections.length; i++) {
            var segmentOther = connections[i];
            var isConnected = this.ToNode.attributes.connections[segment.id + "," + segmentOther.id] == true;
            if(isConnected) {
                return true;
            }
        }
        connections = this.FromNode.getConnectedSegments();
        for(var i = 0; i < connections.length; i++) {
            var segmentOther = connections[i];
            var isConnected = this.FromNode.attributes.connections[segment.id + "," + segmentOther.id] == true;
            if(isConnected) {
                return true;
            }
        }
        return false;
    }
    toNodeConnection = this.ToNode.attributes.connections[this.id + "," + segment.id];
    fromNodeConnection = this.FromNode.attributes.connections[this.id + "," + segment.id];
    toNodeConnection = typeof toNodeConnection !== "undefined" ? toNodeConnection : false;
    fromNodeConnection = typeof fromNodeConnection !== "undefined" ? fromNodeConnection : false;
    
    return toNodeConnection || fromNodeConnection;
};
var SegmentManager = (function () {

    var cache = { };

    // public sections
    return {
        get: function (segment) {
            if(cache[getSegmentId(segment)]) {
                return cache[getSegmentId(segment)];
            }
            var newSegment = new WazeLineSegment(segment);
            cache[getSegmentId(segment)] = newSegment;
            return newSegment;
        },
        getFromId: function (segmentId) {
            var retVal = cache[segmentId];
            if(typeof retVal === "undefined" || retVal == null) { 
                var segment = W.model.segments.get(segmentId);
                if(segment != null) {
                    // this will put it into the cache
                    return this.get(segment);
                }
                return null;
            }
            return retVal;
        },
        clear: function() {
            cache = {};
        }
    }
} ());

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
    getId(this.getCheckboxId()).onclick = highlightAllSegments;
};
WMEFunction.prototype.getModifiedAttrs = function(wazeLineSegment) {
    return new Object();
};

WMEFunction.prototype.getIssueDetail = function(wazeLineSegment) {
   return this.text;
};

WMEFunction.prototype.hasIssue = function(wazeLineSegment) {
   return true;
};

WMEFunction.prototype.getPriority = function(wazeLineSegment) {
   return PRIORITY_INFO;
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

function WazeProperty(propertyName) {
  this.propertyName = propertyName;
}

WazeProperty.prototype.getIcon = function(segmentAttrs) {
};


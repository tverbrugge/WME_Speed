var RoadTypeString = {
    1 : "Streets",
    2 : "Primary Street",
    3 : "Freeways",
    4 : "Ramps",
    5 : "Walking Trails",
    6 : "Major Highway",
    7 : "Minor Highway",
    8 : "Dirt roads",
    10 : "Pedestrian Bw",
    16 : "Stairway",
    17 : "Private Road",
    18 : "Railroad",
    19 : "Runway/Taxiway",
    20 : "Parking Lot Road",
    21 : "Service Road"
};

var speedColor = new WMEFunction("_cbHighlightSpeed", "Speed");
var MAX_THRESHOLD_SPEED = 100;
var MIN_WIDTH_SPEED = 4;
var MAX_WIDTH_SPEED = 10;
var MIN_OPACITY_SPEED = 0.4;
var MAX_OPACITY_SPEED = 0.99;

speedColor.getModifiedAttrs = function(wazeLineSegment) {
    var modifications = new Object();
    var speedToUse = getSegmentSpeed(wazeLineSegment.segment);
    if (isNaN(speedToUse)) {
        speedToUse = 0;
    }
    var percentageWidth = Math.min(speedToUse, MAX_THRESHOLD_SPEED - 1) / MAX_THRESHOLD_SPEED;
    modifications.opacity = ((MAX_OPACITY_SPEED - MIN_OPACITY_SPEED) * percentageWidth) + MIN_OPACITY_SPEED;
    modifications.width = ((MAX_WIDTH_SPEED - MIN_WIDTH_SPEED) * percentageWidth) + MIN_WIDTH_SPEED;
    if (speedToUse < 1) {
        modifications.color = "#000";
        modifications.opacity = 0.2;
    } else {
        modifications.color = getScaledColour(speedToUse, 100);
    }
    return modifications;
};

/*
 * HIGHLIGHT NO CITY
 */
var highlightNoCity = new WMEFunction("_cbHighlightNoCity", "No City");
highlightNoCity.getModifiedAttrs = function(wazeLineSegment) {
    if (wazeLineSegment.noCity) {
        var modifications = new Object();
        modifications.color = "#ff0";
        modifications.opacity = 0.3;
        return modifications;
    }
};
highlightNoCity.getBackground = function() {
    return 'rgba(255,255,0,0.3)';
};

/*
 * highlight UNNAMED
 */
var highlightNoName = new WMEFunction("_cbHighlightUnnamed", "Unnamed Street");
highlightNoName.getModifiedAttrs = function(wazeLineSegment) {
    if (wazeLineSegment.noName) {
        if (isTrafficRelevant(wazeLineSegment.attributes.roadType)) {
            var modifications = new Object();
            modifications.color = "#424";
            modifications.opacity = 0.7;
            return modifications;
        }
    }
};
highlightNoName.getBackground = function() {
    return 'rgba(64,32,64,0.7)';
};

/*
 * highlight HOUSE NUMBERS
 */
var highlightHasHNs = new WMEFunction("_cbHighlightHNs", "Has House Numbers");
highlightHasHNs.getModifiedAttrs = function(wazeLineSegment) {
    var modifications = new Object();
    modifications.color = "#0f0";
    modifications.opacity = 0.4;
    modifications.dasharray = "5 20";
    return modifications;
};
highlightHasHNs.getBackground = function() {
    return 'rgba(0,255,0,0.4)';
};
highlightHasHNs.hasIssue = function(wazeLineSegment) {
    return wazeLineSegment.attributes.hasHNs;
};

/*
 * highlight ALTERNATE NAME
 */
var highlightWithAlternate = new WMEFunction("_cbHighlightWithAlternate", "With Alternate Name");
highlightWithAlternate.getModifiedAttrs = function(wazeLineSegment) {
    var modifications = new Object();
    modifications.color = "#FFFF00";
    modifications.opacity = 0.7;
    return modifications;
};
highlightWithAlternate.hasIssue = function(wazeLineSegment) {
    return wazeLineSegment.secondaryStreetInfos.length > 0;
};
highlightWithAlternate.getBackground = function() {
    return 'rgba(256,256,0,0.7)';
};

/*
 * highlight Extra Spaces in name
 */
var highlightExtraSpaces = new WMEFunction("_cbhighlightExtraSpaces", "Extra Spaces");
highlightExtraSpaces.getModifiedAttrs = function(wazeLineSegment) {
    var modifications = new Object();
    modifications.color = "#FF00FF";
    modifications.opacity = 0.7;
    return modifications;
};

highlightExtraSpaces.hasIssue = function(wazeLineSegment) {
    if (wazeLineSegment.noName) { return false; }
    var streetName = wazeLineSegment.getStreetName();
    if(!streetName) { return false; }
    if(streetName.trim() != streetName || streetName.indexOf("  ") != -1) {
        return true;
    }
    return false;
};

highlightExtraSpaces.getBackground = function() {
    return 'rgba(255,0,255,0.7)';
};

/*
 * highlight Empty alternate street
 */
var highlightEmptyAltStreetName = new WMEFunction("_cbighlightEmptyAltStreetName", "Empty alternate street");
highlightEmptyAltStreetName.getModifiedAttrs = function(wazeLineSegment) {
    for(var strIDIndx = 0; strIDIndx < wazeLineSegment.secondaryStreetInfos.length; strIDIndx++) {
        if(wazeLineSegment.secondaryStreetInfos[strIDIndx].noName) {
           var modifications = new Object();
            modifications.color = "#FF00FF";
            modifications.opacity = 0.7;
            return modifications;
        }
    }
};
highlightEmptyAltStreetName.getBackground = function() {
    return 'rgba(255,0,255,0.7)';
};

/*
 * highlight Invalid Abbreviations
 */
var highlightInvalidAbbrevs = new WMEFunction("_cbhighlightInvalidAbbrev", "Invalid Abbreviations");
highlightInvalidAbbrevs.getModifiedAttrs = function(wazeLineSegment) {
    return MODOBJ_WARN_MODS;
};
highlightInvalidAbbrevs.hasIssue = function(wazeLineSegment) {
    if (wazeLineSegment.noName) { return false }
    var streetName = wazeLineSegment.getStreetName();
    if(!streetName) { return false }
    var idxOfPeriod = streetName.indexOf(".")
    return (idxOfPeriod != -1 && idxOfPeriod == streetName.length - 1);
};
highlightInvalidAbbrevs.getBackground = function() {
    return MODOBJ_WARN_RGBA;
};

/*
 * highlight self connectivity
 */
var highlightSelfConnectivity = new WMEFunction("_cbhighlightSelfConnectivity", "Self connectivity");
highlightSelfConnectivity.getModifiedAttrs = function(wazeLineSegment) {
    return MODOBJ_ERROR_MODS;
};
highlightSelfConnectivity.hasIssue = function(wazeLineSegment) {
    return wazeLineSegment.attributes.fromNodeID == wazeLineSegment.attributes.toNodeID;
};
highlightSelfConnectivity.getBackground = function() {
    return MODOBJ_ERROR_RGBA;
};

/*
 * highlight U-Turn at Dead End
 */
var highlightUTurnAtEnd = new WMEFunction("_cbhighlightUTurnAtEnd", "U-Turn at dead end");
highlightUTurnAtEnd.getModifiedAttrs = function(wazeLineSegment) {
    return MODOBJ_WARN_MODS;
};
highlightUTurnAtEnd.hasIssue = function(wazeLineSegment) {
	var toNodeDeadEndUturn = wazeLineSegment.ToNode.UTurnAllowed(wazeLineSegment.id) && wazeLineSegment.ToNode.isDeadEnd();
	var fromNodeDeadEndUturn = wazeLineSegment.FromNode.UTurnAllowed(wazeLineSegment.id) && wazeLineSegment.FromNode.isDeadEnd();
    return toNodeDeadEndUturn || fromNodeDeadEndUturn;
};
highlightUTurnAtEnd.getBackground = function() {
    return MODOBJ_WARN_RGBA;
};

/*
 * highlight three point segment
 */
var highlightThreePointSegment = new WMEFunction("_cbhighlightThreePointSegment", "Three Point Segment");
highlightThreePointSegment.getModifiedAttrs = function(wazeLineSegment) {
    return MODOBJ_MINOR_MODS;
};
highlightThreePointSegment.hasIssue = function(wazeLineSegment) {
    if(wazeLineSegment.ToNode == null || wazeLineSegment.FromNode == null) { return false; }
    if(wazeLineSegment.ToNode.attributes == null || wazeLineSegment.FromNode.attributes == null) { return false; }
    var toNodeSegIDs = wazeLineSegment.ToNode.attributes.segIDs;
    var fromNodeSegIDs = wazeLineSegment.FromNode.attributes.segIDs;
	var commonNodesFromTo = (toNodeSegIDs.filter(function(n) { return n != wazeLineSegment.id && fromNodeSegIDs.indexOf(n) != -1 }))
	var commonNodesFromFrom = (fromNodeSegIDs.filter(function(n) { return n != wazeLineSegment.id && toNodeSegIDs.indexOf(n) != -1 }))
    return commonNodesFromTo.length > 0 || commonNodesFromFrom.length > 0
};
highlightThreePointSegment.getBackground = function() {
    return MODOBJ_MINOR_RGBA;
};

/*
 * highlight no incoming
 * ------- TODO --------
 */
var highlightNoIncoming = new WMEFunction("_cbhighlightNoIncoming", "No Incoming (BETA)");
highlightNoIncoming.getModifiedAttrs = function(wazeLineSegment) {
    return MODOBJ_WARN_MODS;
};
highlightNoIncoming.hasIssue = function(wazeLineSegment) {
    if(wazeLineSegment.ToNode == null || wazeLineSegment.FromNode == null) { return true; }
    if(wazeLineSegment.ToNode.attributes == null || wazeLineSegment.FromNode.attributes == null) { return true; }
    
    var connectionsToToNode = [];
    var toConnections = wazeLineSegment.ToNode.getConnectedSegments(); 
    for(var i = 0; i < toConnections.length; i++) {
        if(toConnections[i].id != wazeLineSegment.id && toConnections[i].hasHardConnectionTo(wazeLineSegment)) {
            connectionsToToNode[connectionsToToNode.length] = toConnections[i];
        }
    }
    var connectionsToFromNode = [];
    var fromConnections = wazeLineSegment.FromNode.getConnectedSegments(); 
    for(var i = 0; i < fromConnections.length; i++) {
        if(fromConnections[i].id != wazeLineSegment.id && fromConnections[i].hasHardConnectionTo(wazeLineSegment)) {
            connectionsToFromNode[connectionsToFromNode.length] = fromConnections[i];
        }
    }    

    // var commonNodesFromTo = (wazeLineSegment.ToNode.getConnections().filter(function(n) { return n.id != wazeLineSegment.id && n.hasHardConnectionTo(wazeLineSegment) }))
	// var commonNodesFromFrom = (wazeLineSegment.FromNode.getConnections().filter(function(n) { return n.id != wazeLineSegment.id && n.hasHardConnectionTo(wazeLineSegment) }))    
    return (wazeLineSegment.ToNode.Node.isSnapped() && connectionsToToNode.length == 0) 
        || (wazeLineSegment.FromNode.Node.isSnapped() && connectionsToFromNode.length == 0);
};
highlightNoIncoming.getBackground = function() {
    return MODOBJ_WARN_RGBA;
};

/*
 * highlight disconnected
 */
var highlightDisconnected = new WMEFunction("_cbhighlightDisconnected", "Disconnected");
highlightDisconnected.getModifiedAttrs = function(wazeLineSegment) {
    return MODOBJ_WARN_MODS;
};
highlightDisconnected.hasIssue = function(wazeLineSegment) {
    return wazeLineSegment.isTrafficRelevant() && wazeLineSegment.isDisconnected()
};
highlightDisconnected.getBackground = function() {
    return MODOBJ_WARN_RGBA;
};

/*
 * highlight isolated
 */
var highlightIsolated = new WMEFunction("_cbhighlightIsolated", "Isolated (BETA)");
highlightIsolated.getModifiedAttrs = function(wazeLineSegment) {
    return MODOBJ_WARN_MODS;
};
highlightIsolated.hasIssue = function(wazeLineSegment) {
    return wazeLineSegment.isIsolated()
};
highlightIsolated.getBackground = function() {
    return MODOBJ_WARN_RGBA;
};


/*
 * highlight CONST ZN
 */
var highlightConstZn = new WMEFunction("_cbHighlightConstZn", "CONST ZN Street");
highlightConstZn.getModifiedAttrs = function(wazeLineSegment) {
    var modifications = new Object();
    modifications.color = "#FF6600";
    modifications.dasharray = "2 15";
    modifications.opacity = 0.7;
    return modifications;
};
highlightConstZn.hasIssue = function(wazeLineSegment) {
    return !wazeLineSegment.noName && wazeLineSegment.getStreetName().indexOf('CONST ZN') != -1
};
highlightConstZn.getBackground = function() {
    return 'rgba(255,102,0,0.7)';
};

function getCurrentHoverSegment() {
    return highlightSegmentMonitor.getLatestSegment();
}

/*
 * highlight SAME NAME
 */
var highlightSameName = new WMEFunction("_cbHighlightSameName", "Same Street Name");
highlightSameName.getModifiedAttrs = function(wazeLineSegment) {
    var segment = getCurrentHoverSegment();
    if (segment != null) {
        var highlightedStreetID = segment.attributes.primaryStreetID;
        if (wazeLineSegment.attributes.primaryStreetID === highlightedStreetID) {
            var modifications = new Object();
            if (wazeLineSegment.segment.fid !== segment.fid) {
                modifications.dasharray = "5 15";
            }
            modifications.color = "#0ad";
            modifications.opacity = 0.5;
            return modifications;
        }
    }
};
highlightSameName.getBackground = function() {
    return 'rgba(0,160,208,0.5)';
};
highlightSameName.getIssueDetail = function(wazeLineSegment) {
};

/*
 * highlight TOLL
 */
var highlightToll = new WMEFunction("_cbHighlightToll", "Toll");
highlightToll.getModifiedAttrs = function(wazeLineSegment) {
    var modifications = new Object();
    modifications.color = wazeLineSegment.attributes.locked ? "#ff0000" : "#00f";
    modifications.opacity = 0.5;
    modifications.dasharray = "5 15";
    return modifications;
};
highlightToll.hasIssue = function(wazeLineSegment) {
    return wazeLineSegment.attributes.fwdToll;
};
highlightToll.getBackground = function() {
    return 'rgba(0,0,255,0.5)';
};

/*
 * highlight NO DIRECTION
 */
var highlightNoDirection = new WMEFunction("_cbHighlightNoDirection", "Unknown Direction");
highlightNoDirection.getModifiedAttrs = function(wazeLineSegment) {
    var modifications = new Object();
    modifications.color = "#100";
    modifications.opacity = 0.8;
    return modifications;
};
highlightNoDirection.hasIssue = function(wazeLineSegment) {
    return wazeLineSegment.noDirection;
};
highlightNoDirection.getBackground = function() {
    return 'rgba(10,0,0,0.8)';
};

/*
 * highlight ONE WAY
 */
var highlightOneWay = new WMEFunction("_cbHighlightOneWay", "One Way");
highlightOneWay.getModifiedAttrs = function(wazeLineSegment) {
    var modifications = new Object();
    modifications.color = "#00f";
    modifications.opacity = 0.2;
    return modifications;
};
highlightOneWay.hasIssue = function(wazeLineSegment) {
    return wazeLineSegment.oneWay;
};
highlightOneWay.getBackground = function() {
    return 'rgba(0,0,255,0.2)';
};
highlightOneWay.getDetail = function(segment) {
    return isOneWay(segment);
};

/*
 * highlight NON A->B ONE WAY
 */
var highlightNonABOneWay = new WMEFunction("_cbHighlightNonABOneWay", "Non A&rarr;B One Way");
highlightNonABOneWay.getModifiedAttrs = function(wazeLineSegment) {
    return MODOBJ_MINOR_MODS;
};
highlightNonABOneWay.hasIssue = function(wazeLineSegment) {
    return wazeLineSegment.oneWay && wazeLineSegment.attributes.revDirection;
};
highlightNonABOneWay.getPriority = function(wazeLineSegment) {
    return PRIORITY_MINOR;
};
highlightNonABOneWay.getBackground = function() {
    return MODOBJ_MINOR_RGBA;
};


/*
 * highlight UNTERMINATED
 */

var highlightNoTerm = new WMEFunction("_cbHighlightNoTerm", "Unterminated");
highlightNoTerm.getModifiedAttrs = function(wazeLineSegment) {
    return MODOBJ_WARN_MODS;
};
highlightNoTerm.hasIssue = function(wazeLineSegment) {
    return wazeLineSegment.attributes.toNodeID == null || wazeLineSegment.attributes.fromNodeID == null;
};
highlightNoTerm.getBackground = function() {
    return MODOBJ_WARN_RGBA;
};

var highlightEditor = new WMEFunctionExtended("_cbHighlightEditor", "Specific Editor");
highlightEditor.getModifiedAttrs = function(wazeLineSegment) {
    var selectUser = getId(highlightEditor.getSelectId());
    var selectedUserId = selectUser.options[selectUser.selectedIndex].value;
    var updatedBy = wazeLineSegment.attributes.updatedBy;

    if (updatedBy == selectedUserId) {
        var modifications = new Object();
        modifications.color = "#00ff00";
        modifications.opacity = 0.5;
        return modifications;
    }
};
highlightEditor.buildExtended = function() {
    return '<select id="' + this.getSelectId() + '" name="' + this.getSelectId() + '"><br />';
}
highlightEditor.init = function() {
    getId(this.getCheckboxId()).onclick = highlightSegments;
    getId(this.getSelectId()).onchange = this.getSelectFieldChangeFunction();
}
highlightEditor.getBackground = function() {
    return 'rgba(0,255,0,0.5)';
};

/*
 * RECENTLY Edited
 */
var highlightRecent = new WMEFunctionExtended("_cbHighlightRecent", "Recently Edited");
highlightRecent.getModifiedAttrs = function(wazeLineSegment) {
    var numDays = getId(this.getSelectId()).value;
    if (numDays == undefined) {
        numDays = 0;
    }
    var tNow = new Date();
    var tDif = (tNow.getTime() - wazeLineSegment.updatedOn.getTime()) / 86400000;

    if (numDays >= 0 && tDif <= numDays) {
        var modifications = new Object();
        var heatScale = 0.75 / numDays;
        modifications.color = "#0f0";
        modifications.opacity = Math.min(0.999999, 1 - (tDif * heatScale));
        return modifications;
    }
};
highlightRecent.buildExtended = function() {
    return '<input type="number" min="0" max="365" size="3" value="7" id="' + this.getSelectId() + '" /> days';
}
highlightRecent.init = function() {
    getId(this.getCheckboxId()).onclick = highlightSegments;
    getId(this.getSelectId()).onfocus = populateUserList;
    getId(this.getSelectId()).onchange = highlightSegments;
};
highlightRecent.getBackground = function() {
    return 'rgba(0,255,0,0.7)';
};

/*
 * LOCKED segments
 */
var highlightLocked = new WMEFunctionExtended("_cbHighlightLocked", "Locked");
highlightLocked.getModifiedAttrs = function(wazeLineSegment) {
    var modifications = new Object();
    modifications.color = "#B00";
    modifications.opacity = 0.8;
    return modifications;
};
highlightLocked.hasIssue = function(wazeLineSegment) {
    return wazeLineSegment.attributes.locked;
};
highlightLocked.getBackground = function() {
    return 'rgba(176,0,0,0.8)';
};

/*
 * highlight RESTRICTIONS
 */
var highlightSegmentRestrictions = new WMEFunction("_cbhighlightSegmentRestrictions", "Segment Restrictions");
highlightSegmentRestrictions.getModifiedAttrs = function(wazeLineSegment) {
    var modifications = new Object();
    modifications.color = "#FAFF00";
    modifications.dasharray = "2 15";
    modifications.opacity = 0.8;
    return modifications;
};
highlightSegmentRestrictions.hasIssue = function(wazeLineSegment) {
    return hasRestrictions(wazeLineSegment.attributes)
};
highlightSegmentRestrictions.getBackground = function() {
    return 'rgba(250,255,0,0.8)';
};

/*
 * highlight Expired RESTRICTIONS
 */
var highlightSegmentExpiredRestrictions = new WMEFunction("_cbhighlightSegmentExpiredRestrictions", "Expired Segment Restrictions");
highlightSegmentExpiredRestrictions.getModifiedAttrs = function(wazeLineSegment) {
    var modifications = new Object();
    modifications.color = "#FF11AA";
    modifications.opacity = 0.7; 
    return modifications;
};
highlightSegmentExpiredRestrictions.hasIssue = function(wazeLineSegment) {
    return wazeLineSegment.hasExpiredRestrictions();
};
highlightSegmentExpiredRestrictions.getBackground = function() {
    return 'rgba(255,17,170,0.7)';
};

/*
 * highlight ROAD TYPE
 */
var highlightRoadType = new WMEFunctionExtended("_cbHighlightRoadType", "Road Type");
highlightRoadType.roadTypeStrings = RoadTypeString;
highlightRoadType.getModifiedAttrs = function(wazeLineSegment) {

    var currentRoadTypeElement = getId(this.getSelectId());
    var currentRoadType = currentRoadTypeElement.options[currentRoadTypeElement.selectedIndex].value;
    if (currentRoadType == undefined) {
        currentRoadType = 0;
    }

    if (currentRoadType == wazeLineSegment.attributes.roadType) {
        var modifications = new Object();
        modifications.color = "#0f0";
        modifications.opacity = 0.5;
        return modifications;
    }
};
highlightRoadType.buildExtended = function() {
    return '<select id="' + this.getSelectId() + '" name="' + this.getSelectId() + '">';
}
highlightRoadType.init = function() {
    populateOption(this.getSelectId(), this.roadTypeStrings);
    getId(this.getCheckboxId()).onclick = highlightSegments;
    getId(this.getSelectId()).onchange = this.getSelectFieldChangeFunction();
};
highlightRoadType.getBackground = function() {
    return 'rgba(0,255,0,0.5)';
};

/*
 * highlight City
 */
var highlightCity = new WMEFunctionExtended("_cbHighlightCity", "City");
highlightCity.getModifiedAttrs = function(wazeLineSegment) {

    var currentCityElement = getId(this.getSelectId());
    var currentCity = currentCityElement.options[currentCityElement.selectedIndex].value;
    if (currentCity == undefined) {
        currentCity = 0;
    }

    var modifications = new Object();
    if (currentCity == wazeLineSegment.cityID) {
        modifications.color = "#0f0";
        modifications.opacity = 0.5;
        return modifications;
    } 
    if (currentCity == WME_SPEED_UNKNOWN && wazeLineSegment.noCity) {
        modifications.color = "#0f0";
        modifications.opacity = 0.5;
        return modifications;
    }
};
highlightCity.buildExtended = function() {
    return '<select id="' + this.getSelectId() + '" name="' + this.getSelectId() + '">';
}
highlightCity.init = function() {
    getId(this.getCheckboxId()).onclick = highlightSegments;
    getId(this.getSelectId()).onchange = this.getSelectFieldChangeFunction();
};
highlightCity.getBackground = function() {
    return 'rgba(0,255,0,0.5)';
};
highlightCity.getDetail = function(segment) {
    return;
};

/*
 * highlight Street
 */
var highlightStreet = new WMEFunctionExtended("_cbHighlightStreet", "Street");
highlightStreet.getModifiedAttrs = function(wazeLineSegment) {

    var currentCityElement = getId(this.getSelectId());
    var currentCity = currentCityElement.options[currentCityElement.selectedIndex].value;
    if (currentCity == undefined) {
        currentCity = 0;
    }

    var modifications = new Object();
    if (currentCity == wazeLineSegment.cityID) {
        modifications.color = "#0f0";
        modifications.opacity = 0.5;
       return modifications;
    } else if (currentCity == WME_SPEED_UNKNOWN && wazeLineSegment.noCity) {
        modifications.color = "#0f0";
        modifications.opacity = 0.5;
       return modifications;
    }
};
highlightStreet.buildExtended = function() {
    return '<select id="' + this.getSelectId() + '" name="' + this.getSelectId() + '">';
}
highlightStreet.init = function() {
    getId(this.getCheckboxId()).onclick = highlightSegments;
    getId(this.getSelectId()).onchange = this.getSelectFieldChangeFunction();
};
highlightStreet.getBackground = function() {
    return 'rgba(0,255,0,0.5)';
};

/*
 * highlight Short Segments
 */
var highlightShortSegments = new WMEFunctionExtended("_cbHighlightShortSegments", "Short");
highlightShortSegments.getModifiedAttrs = function(wazeLineSegment) {
    var modifications = new Object();
    modifications.color = "#f33";
    modifications.opacity = 0.8;
    modifications.width = 15;
    return modifications;
};
highlightShortSegments.hasIssue = function(wazeLineSegment) {
    var length = getId(this.getSelectId()).value;
    if (length == undefined) {
        length = 0;
    }
    return wazeLineSegment.attributes.length < length;
};
highlightShortSegments.buildExtended = function() {
    return '<input type="number" min="0" max="100" value="5" size="3" id="' + this.getSelectId() + '" /> meters';
}
highlightShortSegments.init = function() {
    getId(this.getCheckboxId()).onclick = highlightSegments;
    getId(this.getSelectId()).onchange = highlightSegments;
    getId(this.getSelectId()).onchange = highlightSegments;
};
highlightShortSegments.getBackground = function() {
    return 'rgba(255,51,51,0.8)';
};

/*
 * highlight NULL
 */
var highlightNull = new WMEFunction("_cbHighlightNull", "NULL");
highlightNull.getModifiedAttrs = function(wazeLineSegment) {
    var modifications = new Object();
    modifications.color = "#dd7700";
    modifications.opacity = 0.001;
    modifications.dasharray = "none";
    modifications.width = 8;
    return modifications;
};

/* *************************************************** */

/*
 * Sections of highlighters
 */
var highlightSection = new SelectSection("Highlight Segments", 'WME_Segments_section', [highlightOneWay, highlightToll, highlightNoName, highlightWithAlternate, highlightCity, highlightRoadType, highlightSameName, highlightConstZn, highlightSegmentRestrictions]);
// Disabled:
// ----------------
// speedColor


var geometrySection = new SelectSection("Geometry", 'WME_geometry_section', [highlightExcessComponents, highlightLowAngles, highlightZigZagsComponents, highlightCloseComponents, highlightNoTerm, highlightShortSegments]);
var issuesSection = new SelectSection("Potential Issues", 'WME_issues_section', [highlightSelfConnectivity, highlightExtraSpaces, highlightEmptyAltStreetName, highlightInvalidAbbrevs, highlightNoDirection, highlightThreePointSegment, highlightDisconnected, highlightNoIncoming, highlightIsolated, highlightSegmentExpiredRestrictions]);
// Disabled:
// ----------------
// highlightUTurnAtEnd

var advancedSection = new SelectSection("Advanced", 'WME_Advanced_section', [highlightEditor, highlightRecent, highlightLocked, highlightNonABOneWay, highlightHasHNs]);

var selectSections = [highlightSection, geometrySection, issuesSection, advancedSection];

var allModifiers = [];
/**  The list of all modifiers to display **/
for (var i = 0; i < selectSections.length; i++) {
    allModifiers = allModifiers.concat(selectSections[i].selections);
}

var hoverDependentSections = [highlightSameName];
// var allModifiers = [geometrySection.selections, highlightSection.selections, advancedSection.selections];

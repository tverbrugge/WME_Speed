var WME_SPEED_Popup;
function initPopup() {
    WME_SPEED_Popup = document.createElement('div');
    WME_SPEED_Popup.id = 'WME_SPEED_Popup';
    getId('editor-container').appendChild(WME_SPEED_Popup);    
}



function getDirectionalSection(segment, isFreeway) {
    var userString = "";
    // Add "One Way" arrow
    if(!isFreeway && isOneWay(segment)) {
        userString += "<div style='background: #000; color:#fff;font-size:.92em;font-weight:bold;line-height:.7em;'>"
        userString += "<img src='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADIAAAARCAAAAAC6bKD1AAABp0lEQVR4XpXRX0hTcRyH4dfDZDW0CSPWqoVnEQghXfQHodNVXYaRYGAXFVjkRRTBumgjCJMZWkMLgnkRWWIorYZhrVKSwv5ehLnFcSw4DaE11s1ghcnhF4yzc+487Ll/4cvnSyHzfLoGL7K/UXdgwztyBEtrhqfYaRdiYhOmV5KOnflVjqVOYHIAbF7PWtRWPKNdPT8wJIA5IRbiZTEn/n7Uksl3QuS/Lau5rFj8mdJE+bWoKJ2TjMOoeN+ZOMrhZCH4uPfRLCz13rp0b4auwVLH6rUZKhpvv2kBwEjGIveLy86QDh3RMMja289ZOS1N7dt9PhHCsP9LuN5K8s0055v2jsKNtjL4tF87X8qTBz0f+icHXFSt63tYZybeHDkvV2MQTjeAo3HPgeLWuFo34Qm0YdKHTgozOR46s8GPrwfiFy4DsqL4ljY+S07rWNLKxXJ1ZFDGMlFiBA/5tlMP9PsbHjTdwX135aabCv5dj6xYfznlAvqoCmIwjO8CPp1eBCvRWIu7Bf5cGdapJhJ2FCezZ79jSW3BxrYn3RKmgEphYaomX4v/Ae4Q1fDFrZZBAAAAAElFTkSuQmCC' />"
        userString += "</div>"
     }
     // Add "No Entrance" hint
     else if(isNoDirection(segment)) {
        userString += "<div style='max-height:17px;height:17px; background-color:#C00000;padding:0;border:0;'>"
        userString += "<img src='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAD8AAAARCAMAAABdJ4SrAAAAVFBMVEXAAAD////JJCTjjY3yycnLLS389fXNNTXEERHJJibooqLhh4fww8PVVFTHHR3XXl7VV1fTTEzxxsbLKyvrrKzGGhr9+fnjjIzggYHRRUXjjo7QPz/hgZD7AAAAS0lEQVR4Xt3LtwHAMAwDMMnpvff//8zKlfRm7LA0VIFVjNDr0mkd/MZ5LfxH+D38Qfg5/Cnyz5F/Ef4KfxP+Dv84+X8ZuDPW+1kKfk1aBDuOnLwdAAAAAElFTkSuQmCC' style='margin:0; padding:0; border:0;' />"
        userString += "</div>"
    }
    return userString;           
}
function showProps(obj, objName) {
  var result = "";
  for (var i in obj) {
    if (obj.hasOwnProperty(i)) {
        result += objName + "." + i + " = " + obj[i] + "\n";
    }
  }
  return result;
}

function getSegmentIcons(segment) {

}

function getPropsHTML(segment, matchingActions, namingMap, otherItemsMap, ignoredItems) {
    "use strict";
    matchingActions = typeof matchingActions !== 'undefined' ? matchingActions : {};
    namingMap = typeof namingMap !== 'undefined' ? namingMap : {};
    otherItemsMap = typeof otherItemsMap !== 'undefined' ? otherItemsMap : {};
    var userString = ""
    if(true) {
        userString += "<div id='segment_details' style='font-size: 0.6em'>"
        if(false)  {
            userString += "hasEmptyStreet: " + segment.hasEmptyStreet() + "<br />"
            var segAddress = segment.getAddress();
            userString += "getAddress: " + segAddress + "<br />"
            for (var addritem in segAddress) {
                userString += "addr item: " + addritem + "<br />"
            }
            var segAddressDetails = segment.getAddressDetails();
            userString += "getAddressDetails: " + segAddressDetails + "<br />"
            for (var addritemDetail in segAddressDetails) {
                userString += "addr item detail: " + addritemDetail + "<br />"
            }
        }
        if(true) {
//            userString += "getRevHeading: " + segment.getRevHeading() + "<br />"
//            userString += "getFwdHeading: " + segment.getFwdHeading() + "<br />"
            for(var keyname in segment.attributes) {
                if(ignoredItems.indexOf(keyname) != -1) {
                    continue;
                }
                var keyNameString = namingMap[keyname] ? namingMap[keyname] : keyname;
                var action = matchingActions[keyname];
                if(action) {
                    var actionResult = action(segment.attributes)
                    if(typeof actionResult !== "undefined" && actionResult != null) {
                        userString += keyNameString + ": " + actionResult + "<br />"
                    }
                } else {
                    var value = segment.attributes[keyname];
                    if(value != null) {
                        userString += keyNameString + ": " + value + "<br />"
                    }
                }
                
            }
            for(var otherName in otherItemsMap) {
                var action = otherItemsMap[otherName];
                if(action) {
                    var actionResult = action(segment)
                    if(actionResult) {
                        userString += otherName + ": " + actionResult + "<br />"
                    }
                }
            }
        }
        userString += "</div>"
    }
    return userString;
}

function FeatureDetail(detailKey, htmlGetter, turnOnIcon, iconString) {
    this.detailKey = detailKey;
    this.htmlGetter = function(segment) {
    }
    if(typeof htmlGetter !== 'undefined') {
        this.htmlGetter = htmlGetter;
    }
    this.turnOnIcon = function(segment) {
        return false;
    }
    if(typeof turnOnIcon !== 'undefined') {
        this.turnOnIcon = turnOnIcon;
    }
    this.iconString = iconString;
}

function showPopup(segment) {
    "use strict";
    debug("showPopup segment.CLASS_NAME == " + segment.CLASS_NAME);
    var user = Waze.loginManager.getLoggedInUser();
//	var segment = getCurrentHoverSegment();
    if(segment != null && segment.CLASS_NAME == "Waze.Feature.Vector.Segment") {
//       console.log(showProps(segment, "segment"));
//       console.log(showProps(segment.attributes, "segment.attributes"));
//        var cmpnnts = segment.geometry.components;
//        var compSegs = getComponentsProperties(cmpnnts);
        var popupClass = "";
		if(segment.attributes.lockRank > 0) {
            if(segment.attributes.lockRank > user.rank) {
                popupClass += "userlocked";
            }
            else {
                popupClass += "locked";
            }
		}
        var userString = "<div id='popup_container' class='" + popupClass + "'>";
        
        var sid = segment.attributes.primaryStreetID;
        var street = Waze.model.streets.get(sid);
        if(typeof street != 'undefined') {
            var isFreeway = false;
            var streetStyleClass = 'WME_SPEED_streetSign';
			switch(segment.attributes.roadType) {
            case 2 : // Primary Street
                streetStyleClass = 'WME_SPEED_primaryStreet';
                break;                
			case 3 : //freeway
                isFreeway = true;
                break;
			case 17: // Private Road
				streetStyleClass = 'WME_SPEED_privateStreet';
				break;
			case 20: // Parking Lot Road
				streetStyleClass = 'WME_SPEED_parkingLot';
				break;
			case 5:  //Walking Trails
			case 10: //Pedestrian Bw
				streetStyleClass = 'WME_SPEED_trailSign';
                break;
            case 8: // Dirt Road
                streetStyleClass = 'WME_SPEED_dirtRoadSign';
                break;
            case 18: // Railroad
                streetStyleClass = 'WME_SPEED_railroadSign';
                break;
			default: 
				break;
			}
            if(sid) {
                var streetName = street.name; 
                if(streetName == null || streetName == "") {
                   streetName = '[UNKNOWN]';
                   streetStyleClass += " WME_SPEED_unknownName";
                }
                var alternateSection = "";
                if(segment.attributes.streetIDs && segment.attributes.streetIDs.length > 0) {
                    alternateSection += "<div class='WME_SPEED_alternateName'>";
                    for(var i = 0; i < segment.attributes.streetIDs.length; i++) {
                        var altStreet = Waze.model.streets.get(segment.attributes.streetIDs[i]);
						if(altStreet) {
                        alternateSection += '<div class="' + streetStyleClass + '">' + altStreet.name + '</div>';
						}
                    }
                    alternateSection += "</div>";
                }
                var isInterstate = false;
                if(isFreeway) { // freeway
                    var regexMatch = streetName.match(InterstateRegEx);
                    if(regexMatch != null) {
                        isInterstate = true;
                        streetStyleClass = 'WME_SPEED_interstate';
                        var interstateNum = regexMatch.first().substr(2).trim();
                        streetName = interstateNum;
                    }
                }
                
                // Add "Toll"
                if(segment.attributes.revToll || segment.attributes.fwdToll) {
                    userString += "<div id='WME_SPEED_tollRoad'>Toll</div>"
                }
                
                userString += getDirectionalSection(segment, isFreeway);

                userString += "<div id='popup_street_name' class='" + streetStyleClass + "'>";
                var streetNamePieces = streetName.split(' / ');
                for(var snpIndex = 0; snpIndex < streetNamePieces.length; snpIndex++) {
                    var prefixStr = "";
                    var suffixStr = "";
                    var steetNamePiece = streetNamePieces[snpIndex].trim();
                    for(var i = 0; i < FRONT_ABBREVS.length; i++) {
                        var strToMatch = FRONT_ABBREVS[i] + " ";
                        var startIndex = steetNamePiece.search(strToMatch)
                        if(startIndex == 0) {
                            prefixStr = "<span id='street_name_prefix'>" + steetNamePiece.slice(startIndex,strToMatch.length) + "</span>";
                            steetNamePiece = steetNamePiece.slice(strToMatch.length);
                            break;
                        }
                    }
                    for(var i = 0; i < END_ABBREVS.length; i++) {
                        var strToMatch = " " + END_ABBREVS[i];
                        var expectedIndex = steetNamePiece.length - strToMatch.length;
                        if(expectedIndex > 0 && steetNamePiece.search(strToMatch) == expectedIndex) {
                            suffixStr = "<span id='street_name_suffix'>" + steetNamePiece.slice(expectedIndex) + "</span>";
                            steetNamePiece = steetNamePiece.slice(0, expectedIndex);
                            break;
                        }
                    }
                    userString += prefixStr + steetNamePiece + suffixStr;
                    if(snpIndex != streetNamePieces.length - 1) {
                        userString += '<br />';
                    }
                }
                userString += "</div>";
            }
            var city = Waze.model.cities.get(street.cityID);
            if(city && city.attributes.name) {
                userString += "<div id='popup_street_city' class='" + streetStyleClass + "'>"
                userString += city.attributes.name;
                userString += "</div>"
            }
            userString += alternateSection;
        }
        userString += "<div id='popup_icon_section'>ICON SECTION</div>"
        
        // var speedToUse = getSegmentSpeed(segment);
        var speedToUse = getSegmentSpeedLimit(segment);
        if(!isNaN(speedToUse) || typeof speedToUse === "string") {
            var speedToUseStr = "" + speedToUse;
            var speedNote = "";
            if(!isSameSpeedLimitBothDirections(segment)) { speedNote = "&ne;&alefsym;" }
                
            var popupSpeedClass = 'popup-speed-value';
            if(!isSpeedLimitVerified(segment)) {
                popupSpeedClass += ' popup-speed-value-unverified';
            }
            userString += "<div id='popup_speed'>"
            userString += "<div id='popup_speed_header'>SPEED<br />LIMIT</div><div id='popup_speed_value' class='" + popupSpeedClass + "'>" + speedToUseStr + "<span class='popup_speed_note'>" + speedNote + "</span></div>"
            userString += "</div>";
        }
        // roadTypeToString
        userString += getPropsHTML(segment, 
            {
            'createdOn': function(segmentAttr) { 
                var dateVal = new Date(segmentAttr.createdOn)
                return dateToDateString(dateVal) + " by " + getEditorName(segmentAttr.createdBy);
            }, 
            'updatedOn': function(segmentAttr) { 
                var dateVal = new Date(segmentAttr.updatedOn)
                return dateToDateString(dateVal) + " by " + getEditorName(segmentAttr.updatedBy);
            }, 
            'roadType' : function(segmentAttr) { return roadTypeToString(segmentAttr.roadType); },
            'hasHNs' : function(segmentAttr) { return segmentAttr.hasHNs ? "Yes" : undefined },
            'hasClosures' : function(segmentAttr) { return segmentAttr.hasClosures ? "Yes" : undefined },
            'length' : function(segmentAttr) { return lengthToString(segmentAttr.length); },
            'fwdRestrictions' : function(segmentAttr) { return hasRestrictions(segmentAttr) ? "Yes" : undefined },
            'fwdMaxSpeedUnverified' : function(segmentAttr) { return segmentAttr.fwdMaxSpeedUnverified ? "unverified" : undefined },
            'revMaxSpeedUnverified' : function(segmentAttr) { return segmentAttr.revMaxSpeedUnverified ? "unverified" : undefined },
            'fwdMaxSpeed' : function(segmentAttr) {},
            'revMaxSpeed' : function(segmentAttr) {},
            'separator' : function(segmentAttr) {},
            'level' : function(segmentAttr) {return levelToString(segmentAttr.level) },
            'validated' : function(segmentAttr) {},
            'createdBy' : function(segmentAttr) {  },
            'updatedBy' : function(segmentAttr) {  },
//            'primaryStreetID' : function(segmentAttr) {  },
            'streetIDs' : function(segmentAttr) { },
            'permissions' : function(segmentAttr) {},
            'fwdTurnsLocked' : function(segmentAttr) {},
            'revTurnsLocked' : function(segmentAttr) {},
            'fwdToll' : function(segmentAttr) { return undefined  },
            'revToll' : function(segmentAttr) {},
            'allowNoDirection' : function(segmentAttr) {},
            'lockRank' : function(segmentAttr) { return segmentAttr.lockRank == null ? null :  segmentAttr.lockRank + 1 },
            'rank' : function(segmentAttr) {},
            'type' : function(segmentAttr) {},
            'fwdDirection' : function(segmentAttr) {},
            'revDirection' : function(segmentAttr) {},
            'fromConnections' : function(segmentAttr) {},
            'toConnections' : function(segmentAttr) {},
        }, {'hasHNs' : "Has House Numbers",
			'roadType' : "Road Type", 
			'fwdRestrictions' : "Restrictions",
			'level' : "Elevation",
            'fwdToll' : "Toll Road",
             'lockRank' : "Rank",
             'hasClosures' : "Has Closures" }, 
        {
         "Nodes" : function(segmnt) { return segmnt.geometry.components.length}
        }, ['revRestrictions', 'version', 'fromNodeID', 'toNodeID', 'geometry']);

        var checkedMods = checkedModifiers()
        var wazeLineSeg = SegmentManager.get(segment);
        for(var i = 0; i < checkedMods.length; i++) {
//            var checkedVal = checkedMods[i].getDetail(segment);
            if(!checkedMods[i].hasIssue(wazeLineSeg)) { continue; }

            var checkedVal = checkedMods[i].getModifiedAttrs(wazeLineSeg);
            if(typeof checkedVal != 'undefined') {
                var issueDetail = checkedMods[i].getIssueDetail(wazeLineSeg)
                if(typeof issueDetail != 'undefined' && issueDetail != null) {
                    userString += issueDetail +  '<br />';
                }                
            }
        }
        userString += "</div>"

        WME_SPEED_Popup.innerHTML = userString;
    }
    else {
        WME_SPEED_Popup.innerHTML = "";
    }
}
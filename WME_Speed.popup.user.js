var WME_SPEED_Popup = document.createElement('div');
WME_SPEED_Popup.id = 'WME_SPEED_Popup';
getId('editor-container').appendChild(WME_SPEED_Popup);

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

function showPopup(segment) {
    var user = loginManager.getLoggedInUser();
//	var segment = getCurrentHoverSegment();
    if(segment != null) {
//        var cmpnnts = segment.geometry.components;
//        var compSegs = getComponentsProperties(cmpnnts);
        var popupClass = "";
		if(segment.attributes.locked) {
            if(segment.attributes.lockRank > user.rank) {
                popupClass += "userlocked";
            }
            else {
                popupClass += "locked";
            }
		}
        var userString = "<div id='popup_container' class='" + popupClass + "'>";
        
        var sid = segment.attributes.primaryStreetID;
        var street = wazeModel.streets.get(sid);
        if(typeof street != 'undefined') {
            var isFreeway = false;
            var streetStyleClass = 'WME_SPEED_streetSign';
			switch(segment.attributes.roadType) {
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
                        var altStreet = wazeModel.streets.get(segment.attributes.streetIDs[i]);
                        alternateSection += '<div class="' + streetStyleClass + '">' + altStreet.name + '</div>';
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
                var streetNamePieces = streetName.split('/');
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
            var city = wazeModel.cities.get(street.cityID);
            if(city && city.name) {
                userString += "<div id='popup_street_city' class='" + streetStyleClass + "'>"
                userString += city.name;
                userString += "</div>"
            }
            userString += alternateSection;
        }
        
        var speedToUse = getSegmentSpeed(segment);
        if(!isNaN(speedToUse)) {
            userString += "<div id='popup_speed'>"
            userString += "<div id='popup_speed_header'>SPEED<br />LIMIT</div><div id='popup_speed_value'>" + speedToUse + "</div>"
            userString += "</div>";
        }
        userString += "</div>"
        WME_SPEED_Popup.innerHTML = userString;
    }
    else {
        WME_SPEED_Popup.innerHTML = "";
    }
}
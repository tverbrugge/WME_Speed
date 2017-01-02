

var possibleWazeMapEvents = ["mouseout", "zoomend"];
var possibleControllerEvents = ["loadend"];
var possiblePendingControllerEvents = [];
var possibleSelectionModifyEvents = ["deactivate", "featuredeselected"];
var possibleSelectionEvents = ["selectionchanged"];
var possibleSelectionModifyHoverEvents = [];
var possibleActionEvents = [];
var possibleDataEvents = ["loadend"];


var webStorageSupported = ('localStorage' in window) && window['localStorage'] !== null;

function checkedModifiers() {
    var checkedModifiers = [];
	for (var i = 0; i < allModifiers.length; i++) {
		var segModGroup = allModifiers[i];
		var isChecked = getId(segModGroup.getCheckboxId()).checked
		if (isChecked) {
			checkedModifiers[checkedModifiers.length] = segModGroup;
		}
    }
    return checkedModifiers;
}

function highlightAllSegments() {
    modifySegements(highlightNull);
    highlightSegments(allModifiers);
}

function highlightSegments(modifiers) {
    "use strict";
    if(!modifiers) {
        modifiers = allModifiers;
    }
	for (var i = 0; i < modifiers.length; i++) {
		var segModGroup = modifiers[i];
		var isChecked = getId(segModGroup.getCheckboxId()).checked
		if (isChecked) {
			modifySegements(segModGroup);
		}
		if(webStorageSupported) {
			if(isChecked) {
				window.localStorage.setItem(segModGroup.checkboxId, 'checked');
			} else {
				window.localStorage.removeItem(segModGroup.checkboxId);
			}
		}
	}
	return true;
}

function enumerateAllModifiers(work) {
    for (var i = 0; i < allModifiers.length; i++) {
        var segModGroup = allModifiers[i];
        work(segModGroup);
    }
}

function modifySegements(modifier) {
    "use strict";
    for (var seg in Waze.model.segments.objects) {
        var segment = Waze.model.segments.get(seg);
        var attributes = segment.attributes;
        var line = getId(segment.geometry.id);

        if (line != null) {
             if(false) {
            var sid = attributes.primaryStreetID;
            if (sid == null)
                continue;
			if(Waze.model.streets.get(sid) == null) {
				continue;
			}
             }
            var currentColor = line.getAttribute("stroke");
            var currentOpacity = line.getAttribute("stroke-opacity");
            var currentDashes = line.getAttribute("stroke-dasharray");
            var currentWidth = line.getAttribute("stroke-width");

            // check that WME hasn't highlighted this segment
            if (currentOpacity == 1 || currentWidth == 9) {
                continue;
            }

            var roadType = attributes.roadType;
            if (Waze.map.zoom <= 3 && (roadType < 2 || roadType > 7)) {
                if (currentOpacity > 0.1) {
                    line.setAttribute("stroke", "#dd7700");
                    line.setAttribute("stroke-opacity", 0.001);
                    line.setAttribute("stroke-dasharray", "none");
                }
                continue;
            }

            var wazeLineSeg = SegmentManager.get(segment);
            if(!modifier.hasIssue(wazeLineSeg)) {
                continue;
            }
            var lineMods = modifier.getModifiedAttrs(wazeLineSeg);
			
			if((typeof lineMods === "undefined") || lineMods == null) {
				continue;
			}
            debug("seg = " + seg)

            var newColor = lineMods.color ? lineMods.color : currentColor;
            line.setAttribute("stroke", newColor);

            if (lineMods.color && lineMods.color != currentColor) {
            }
            if (lineMods.opacity && lineMods.opacity != currentOpacity) {
                line.setAttribute("stroke-opacity", lineMods.opacity);
            }
            if (lineMods.dasharray && lineMods.dasharray != currentDashes) {
                line.setAttribute("stroke-dasharray", lineMods.dasharray);
            }
            if (lineMods.width && lineMods.width != currentWidth) {
                line.setAttribute("stroke-width", lineMods.width);
            }
        }
    }
}

// add logged in user to drop-down list
function initUserList() {
    var thisUser = Waze.loginManager.getLoggedInUser();
    var selectUser = getId(highlightEditor.getSelectId());
    var usrOption = document.createElement('option');
    var usrText = document.createTextNode(thisUser.userName + " (" + thisUser.rank + ")");
    usrOption.setAttribute('value', thisUser.id);
    usrOption.appendChild(usrText);
    selectUser.appendChild(usrOption);
}

function populateOption(selectId, optionsMap) {
    var select = getId(selectId);
    var currentId = null;
    if (select.selectedIndex >= 0) {
        currentId = select.options[select.selectedIndex].value;
    }
    select.options.length = 0;

    var foundSelected = false;
    for (var key in optionsMap) {
        var text = optionsMap[key];
        var selectOption = document.createElement('option');
        var selectText = document.createTextNode(text);
        if (currentId != null && key == currentId) {
            selectOption.setAttribute('selected', true);
            foundSelected = true;
        }
        selectOption.setAttribute('value', key);
        selectOption.appendChild(selectText);
        select.appendChild(selectOption);
    }

}

// populate drop-down list of Cities
function populateCityList() {
    var cityIds = new Object();
    cityIds[WME_SPEED_UNKNOWN] = "No City";
    for (var cit in Waze.model.cities.objects) {
        var city = Waze.model.cities.get(cit);
        if (city && cityIds[city.attributes.id] == null && city.attributes.name != null && city.attributes.name.length > 0) {
            var cityName = city.attributes.name;
            var state = Waze.model.states.get(city.attributes.stateID);
            if(state && state.name != null && state.name.length > 0) {
                cityName += ', ' + state.name;
            }
            cityIds[city.attributes.id] = cityName;
        }
    }
    populateOption(highlightCity.getSelectId(), cityIds);  
}

function getEditorName(editorId) {
    var user = Waze.model.users.get(editorId);
    if (user == null || user.userName == null || user.userName.match(/^world_|^usa_/) != null) {
        return null;
    }
    return user.userName;
}

// populate drop-down list of editors
function populateUserList() {
    var editorIds = new Object();
    for (var seg in Waze.model.segments.objects) {
        var segment = Waze.model.segments.get(seg);
        var updatedBy = segment.attributes.updatedBy;
        if (editorIds[updatedBy] == null) {
            var user = getEditorName(updatedBy);
            if (user == null) {
                continue;
            }
            editorIds[updatedBy] = user;
        }
    }
    populateOption(highlightEditor.getSelectId(), editorIds);
}

function createSectionHeader(title, opened) {
    var indicator = "&lt;&lt;"
    if(!opened) {
        indicator = "&gt;&gt;"
    }
    return '<span style="font-size:1.2em;"><b>' + title + '</b></span><span style="float:right;padding:0;margin:0 0 0 2px;border: 1px solid #999; background: #aaa; color:#fff;">' + indicator + '</span>'
}

function createSection(sectionItem) {
    var thisSectionItem = sectionItem;
    // advanced options
    var section = document.createElement('div');
    section.style.marginTop = "4px";
    section.style.padding = "4px";
    section.style.borderStyle = "solid";
    section.style.borderWidth = "1px";
    section.style.borderColor = "#aaa";
    section.id = thisSectionItem.id;
    var aheader = document.createElement('div');
    aheader.innerHTML = createSectionHeader(thisSectionItem.header, false);
    aheader.style.display = 'block';
    aheader.style.cursor = 'pointer';

    section.appendChild(aheader);
    
    var segmentsContainer = document.createElement('div');
    segmentsContainer.style.display = 'none';
    aheader.onclick = function() {
        if(segmentsContainer.style.display == 'block') {
            segmentsContainer.style.display = 'none';
            aheader.innerHTML = createSectionHeader(thisSectionItem.header, false);
        } else {
            segmentsContainer.style.display = 'block';
            aheader.innerHTML = createSectionHeader(thisSectionItem.header, true);
        }
    };
    section.appendChild(segmentsContainer);
    
    var modifiers = thisSectionItem.selections;
    for (var i = 0; i < modifiers.length; i++) {
        var segMod = modifiers[i];
        var segmentContainer = document.createElement('div');
        
        var segmentColor = document.createElement('div');
        segmentColor.innerHTML="▶";
        segmentColor.style.color = segMod.getBackground();
        segmentColor.style.textShadow = "1px 1px 2px #333";
        segmentColor.style.cssFloat = "left";
        segmentColor.style.height = "100%";
        segmentColor.style.lineHeight = "100%";
        segmentColor.style.verticalAlign = "middle";
        
        var segmentBuild = document.createElement('div');
		var isChecked = window.localStorage.getItem(segMod.getCheckboxId()) === 'checked';
        segmentBuild.innerHTML = segMod.build(isChecked);
        segmentBuild.style.paddingLeft = "1.5em";
        
        segmentContainer.appendChild(segmentColor);
        segmentContainer.appendChild(segmentBuild);
        //    segmentContainer.style.background = segMod.getBackground();
        segmentsContainer.appendChild(segmentContainer);
    }
    return section;
}

function toggleAddonVisible() {
    var visibleElement = getId("highlight-addon");
    if(visibleElement.style.display == "none") {
        visibleElement.style.display = "block";
    }
    else {
        visibleElement.style.display = "none";
    }
}

var stylizer = document.createElement('style');
stylizer.innerHTML = "#WME_SPEED_addOnToggle{"
stylizer.innerHTML += generateTopDownGradient('#eeeeee', '#cccccc');
stylizer.innerHTML += "border: 1px solid #ccc; \
border-bottom: 1px solid #bbb; \
-webkit-border-radius: 3px; \
-moz-border-radius: 3px; \
-ms-border-radius: 3px; \
-o-border-radius: 3px; \
border-radius: 3px; \
color: #333; \
font: bold 11px 'Lucida Grande', 'Lucida Sans Unicode', 'Lucida Sans', Geneva, Verdana, sans-serif;\
padding: 0.1em 0.2em; \
text-shadow: 0 1px 0 #eee; \
width: 120px; } "
stylizer.innerHTML += "#WME_SPEED_addOnToggle:hover{ "
stylizer.innerHTML += generateTopDownGradient('#dddddd', '#bbbbbb');
stylizer.innerHTML += "border: 1px solid #bbb; \
border-bottom: 1px solid #999; \
cursor: pointer; \
text-shadow: 0 1px 0 #ddd; } "
stylizer.innerHTML += 
"#WME_SPEED_addOnToggle:active{ \
    border: 1px solid #aaa; \
    border-bottom: 1px solid #888; \
    -webkit-box-shadow: inset 0 0 5px 2px #aaaaaa, 0 1px 0 0 #eeeeee; \
    -moz-box-shadow: inset 0 0 5px 2px #aaaaaa, 0 1px 0 0 #eeeeee; \
    box-shadow: inset 0 0 5px 2px #aaaaaa, 0 1px 0 0 #eeeeee; \
} "
stylizer.innerHTML += "#WME_SPEED_Popup {background: #fff;position:absolute;bottom:48px;right:24px;}"
stylizer.innerHTML += "#WME_SPEED_Popup #popup_container {text-align: center;font-size: 1.1em; margin: 1px; border:solid 1px #000;border-radius: 2px;}"
stylizer.innerHTML += "#WME_SPEED_Popup #popup_container.locked {border:dashed 2px #f00;}"
stylizer.innerHTML += "#WME_SPEED_Popup #popup_container.userlocked {border:solid 2px #f00;}"

stylizer.innerHTML += "#WME_SPEED_Popup #popup_container #popup_street_name {font-size:.8em; margin:0;padding:0;line-height:1em;} \
#WME_SPEED_Popup #popup_container #popup_street_name #street_name_prefix {font-size: .6em;vertical-align:middle;} \
#WME_SPEED_Popup #popup_container #popup_street_name #street_name_suffix {font-size: .65em;vertical-align:top;}"

stylizer.innerHTML += "#WME_SPEED_Popup #popup_container #popup_street_city {font-size:.8em;margin:1px 0 0 0;padding:0;line-height:1em;}"
stylizer.innerHTML += "#WME_SPEED_Popup .WME_SPEED_parkingLot, #WME_SPEED_Popup .WME_SPEED_privateStreet { background-color:#aaa;color:#000;font-style:italic;}"
stylizer.innerHTML += "#WME_SPEED_Popup .WME_SPEED_streetSign, #WME_SPEED_Popup .WME_SPEED_primaryStreet {background: #006F53; color:#fff;}"
stylizer.innerHTML += "#WME_SPEED_Popup .WME_SPEED_primaryStreet {font-weight: bold; line-height:1.3em;}"
stylizer.innerHTML += "#WME_SPEED_Popup .WME_SPEED_trailSign {background: #8C6019; color:#000; font-weight:bold;}"
stylizer.innerHTML += "#WME_SPEED_Popup .WME_SPEED_dirtRoadSign {background: #754546; color:#E2C99B; font-weight:normal;}"
stylizer.innerHTML += "#WME_SPEED_Popup .WME_SPEED_railroadSign {background: #fff; color:#000; font-weight:normal; border: solid 1px #000;}"
stylizer.innerHTML += "#WME_SPEED_Popup .WME_SPEED_unknownName {font-style:italic; }"
stylizer.innerHTML += "#WME_SPEED_Popup .WME_SPEED_alternateName {font-style:italic; border: solid 1px white; font-size:.7em;padding:0;line-height:.95em;  }"
stylizer.innerHTML += "#WME_SPEED_Popup .WME_SPEED_parkingLot {\
height:21px;\
padding-right:17px;\
background-position:right center;\
background-repeat:no-repeat;\
background-image: url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAB4AAAAVCAYAAABR915hAAAACXBIWXMAAABPAAAATwFjiv3XAAACQElEQVR42sXWT2iUZxDH8c/srtu4zUGtVrBtpBaEokgNohR7CHjyYkvBkxXU2igpIoIgCB7EevQWxKiotILg0lLspdSqFy+CFMVDS0Gwaq0aSeK/YjTJ9LJqupBVE40Dz+Ed5nm/88wz83vf0OUe3vRs+xdXcRyd2Z5/GIMVXiC2gtn4GudjX6wZL/BwK0v7oiu+GC046kp9GWdGiG3Gx5g0bHe3Ju/nyrz/ouBS3fPpbM8VI2Z5MKZ55CcsAmmaBz7Hd6+01Lk6u7EK+dSpbVzuuNbNvcNcU8YFHPtjXh3s71cOjt3xniGH69rz7GjA9c21JLri1Aj9X1bSiqZh3n80qb4M8HRh+nMOYkobRzNKYxGQ+9LqbM/qaAWk/sT30N0g/pZwUujMtXl1LJJZDz7WSEBephW8Jntt4NIzm3dPzDXBtfwye+JQTPKgptNlF3JNXouuWJDr8mzsjVZFlwx62x1XNJvjLef8ZYKKluzI32N/vGvQfG843vDEUY2igqohm0C/DxVsVvSRAT/G9igLO2NPLMQ3PnBHWq+iRcEuvbaoaFHSEXtjqiFHhXke2tq41H2Woiq1RTXKtfkdlPprKh2oKDiMX7ItB/73x5IWK5pT+5gsEb7FAeGHxuAh67AUM/X5rPaCXsyQvs8N2Y9moQPLnyT3eDcbhJ21hHvxDlqlnwu4iRu1dftJmQ/EDNzSbqGJFkif4hF+028bPontUZL+zK/yVxzRYxnuKhpAn+suSp3SXZOdkGZhG3b8B9u3s4ceFzVrAAAAAElFTkSuQmCC');\
}"
stylizer.innerHTML += "#WME_SPEED_Popup #popup_container #popup_street_name.WME_SPEED_interstate {background-color: #006F53; background-image: url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAB4AAAAeCAIAAAC0Ujn1AAAABnRSTlMA/wD/AP83WBt9AAAACXBIWXMAAAsTAAALEwEAmpwYAAADPElEQVR42rXWzWsTWxjH8e+cTgiTVNvEoi5sqvW1paCiFBciWKluAiKC4E7c6EKqCK5c+A8IbisqKCJuFAQ3roW6sCAl+NJILDY1jZnO5MWazOT1uYvJrVdvq6jTHwNz5uE5Hw4zzMzRRAQALMvqSCQYGiIQADRN8+rthnqdyUmUYv9+dH2ZhlpN3r5l9+5oNOrVde9ULpfDjx8b588TCjEwQG8vPT2EQjgOts3cHG/eUKkAhMMMDbFpE9EohkGlgmUxO8v0NI7z9e5d59QpwzAA5dFOLmdcuwawdy8bNpBO8/o1a9YwPc3Wreg6Y2Ps2MHZs+zZw65dGAavXvHoEZEIlQoHD3LkCNB59WrZND1TAYVCIXL7NrkcwPAwx49z8SKpFJUKPT0kk+g6tRojIwwOYll8+EAySTzO6CjFIhMT9PczMQGQyXTdv18qldp0q1zuuHWLpSSTbNny7bJYBNi8mRcvuHePkyfb9b4+Bgf594ZSq3nDwM2bDccBdMdxjGfPsKx2UyIBMDWF65JIYNscPcrLl4yPE4mwbx+Tk3z+TKvFgwd0dFCp0GhQLDIywtOnAJ8+BZ4/r584odm2/WWq6M7M419CA7HOgU4WFux16wT8PPr6xLZtlU5rto2/SafJ5zU1M4PvEeHdO1f5vmQvi4sB1WwGV8UmpAKB2mrAuu6qaFRWg167tqr6+/2nNY2dO4MqFmP9ep/p7dvp6kJpmvfN8jMeqILBYDzu+ksfO/Y1HA4jItmstXGjb295LCa5nCUiCggG1diYbw/z8uVmMKi3/2wiMju70Nvrw5K3bZNMZsEz23SpVHr4sPqXrqbJkyfO4uLid7SImKZ57txf0VeuiGmaS+A3utlsZrPW6OgfuvG4ZLMLrVZrGVpEXNf9+LFw6NBvu4cPy9xcoVar/Vf7jvb0TMY+ffo33DNnZH7edl33B+pHWkTq9XouZ46PN7u7f4FGo3LnTsM0zUaj8X9nGdqLbdup1JcLF8QwlkFDIbl0SVKpQj6fX0lYkRaRarVqWVYyWbh+XYaHRSlRSg4ckBs35P37vGVZ9Xr9J9O1pe3kSmk2m95uyLY1pYhEBOju7lZK/XziPwFBIyW1EjjMAAAAAElFTkSuQmCC'); background-repeat: no-repeat; background-position: center center; color:#fff;font-size:.92em;font-weight:bold;min-height:30px;vertical-align: 2px; line-height: 30px;margin: 0 auto;width: 100%}"
stylizer.innerHTML += ".WME_SPEED_interstate#popup_street_city { display: none; }";
stylizer.innerHTML += "#WME_SPEED_Popup #WME_SPEED_tollRoad {background: #FFC500; color:#000;font-size: .8em; text-transform: uppercase; font-weight: bold;}"



stylizer.innerHTML += 
"#WME_SPEED_Popup #popup_container #popup_speed { \
margin:0.2em auto; \
padding: 0.3em; \
text-align:center; \
border:solid 1px #000; \
border-radius: .2em; \
width:3.1em; \
line-height: 1;\
letter-spacing: 0.07em; \
}\
.popup-speed-value-unverified { font-style: italic; }\
.popup_speed_note { font-size: .4em; }\
\
"
stylizer.innerHTML += "#WME_SPEED_Popup #popup_container #popup_speed #popup_speed_header {font-size:0.65em;line-height:1.2em;margin-bottom:0.1em;padding:0;}"
stylizer.innerHTML += "#WME_SPEED_Popup #popup_container #popup_speed #popup_speed_value {\
font-size:2.0em;\
font-weight:bold;\
margin:0.0em;\
padding:0;\
display:block;}"


// add new box to the map
var addonContainer = document.createElement('section');
var clickBarContainer = document.createElement('div');
var clickBar = document.createElement('a');
clickBar.id = "WME_SPEED_addOnToggle"
clickBar.innerHTML = 'Show / Hide';
clickBar.style.textAlign = 'center';
clickBar.onclick = toggleAddonVisible;
clickBarContainer.style.margin = '0 auto';
clickBarContainer.style.textAlign = 'center';
clickBarContainer.style.minHeight = '1.2em';
clickBarContainer.appendChild(clickBar);
addonContainer.appendChild(clickBarContainer);

var addon = document.createElement('section');
addon.id = "highlight-addon";

addon.innerHTML = '<b>WME Speed</b> ' + version;

for(var i = 0; i < selectSections.length; i++) {
    addon.appendChild(createSection(selectSections[i]));
}

var section = document.createElement('div');
section.innerHTML = '<button type="button" id="_cbRefreshButton">Refresh</button> ';
addon.appendChild(section);

addonContainer.style.fontSize = "0.8em";
addonContainer.style.margin = "8px";
addonContainer.style.background = "#fff"
addonContainer.style.border = "silver solid 1px";
addonContainer.style.position = "absolute";
addonContainer.style.bottom = "24px";
addonContainer.style.clear = "all";
addonContainer.style.padding = "12px";
addonContainer.style.mozBorderRadius = "5px";
addonContainer.style.webkitBorderRadius = "5px";
addonContainer.style.borderRadius = "5px";
addonContainer.style.boxShadow = "2px 2px 5px #000"
addonContainer.appendChild(addon);

getId('editor-container').appendChild(stylizer);
getId('editor-container').appendChild(addonContainer);

debug("Hi There")

// check for AM or CM, and unhide Advanced options
var advancedMode = false;
if (Waze.loginManager != null) {
    thisUser = Waze.loginManager.getLoggedInUser();
    if (thisUser != null && thisUser.normalizedLevel >= 4) {
        advancedMode = true;
//        initUserList();
        populateUserList();
        populateCityList();
    }
}

// setup onclick handlers for instant update:
getId('_cbRefreshButton').onclick = highlightAllSegments;
enumerateAllModifiers(function(seg) {
    seg.init();
});



function createWazeMapEventAction(actionName) {
    debug("register createWazeMapEventAction(actionName)");
    return function() {
        setTimeout(function() {
            highlightAllSegments();
//                    showPopup();

        }, 50);
        return true;
    };
}

function analyzeNodes() {
    var wazeNodes = new Object();
    for (var wazeNode in Waze.model.nodes.objects) {
        var attachedSegments = [];
        for(var wazeSegID in wazeNode.data.segIDs) {
            attachedSegments.push(Waze.model.segments.objects[wazeSegID]);
        }
        wazeNodes[wazeNode.fid] = new WazeNode(wazeNode, attachedSegments);
    }
}

function createEventAction(eventHolderName, actionName) {
    debug("register createEventAction(" + eventHolderName + "," + actionName + ")");
    return function() {
        debug("EventAction(eventHolderName, actionName)");
        highlightAllSegments();
        populateUserList();
        populateCityList();
//        showPopup();
        return true;
    };
}

function createHighlighAction(eventHolderName, actionName) {
    debug("register createHighlighAction(eventHolderName, actionName)");
    return function(e) {
        if(e.feature.model) {
        debug("HighlightAction(eventHolderName, actionName)");
        highlightSegmentMonitor.updateLatestSegment(e.feature.model);
        showPopup(e.feature.model);
        highlightSegments(hoverDependentSections);
        return true;
        }
    };
}

var loadFunction = function(e) {
    "use strict";
    debug("event listener for load");
    initPopup();
    thisUser = Waze.loginManager.getLoggedInUser();
    if (!advancedMode && thisUser.normalizedLevel >= 4) {
        advancedMode = true;
        populateUserList();
        populateCityList();
    }
    for (var i = 0; i < possibleControllerEvents.length; i++) {
        var eventName = possibleControllerEvents[i];
        Waze.controller.events.register(eventName, this, createEventAction("controller", eventName));
    }
    for (var i = 0; i < possibleWazeMapEvents.length; i++) {
        var eventName = possibleWazeMapEvents[i];
        Waze.map.events.register(eventName, this, createWazeMapEventAction(eventName));
    }
    for (var i = 0; i < possiblePendingControllerEvents.length; i++) {
        var eventName = possiblePendingControllerEvents[i];
        pendingControl.events.register(eventName, this, createEventAction("pendingControl", eventName));
    }
    for (var i = 0; i < possibleSelectionModifyEvents.length; i++) {
        var eventName = possibleSelectionModifyEvents[i];
//        selectionManager.modifyControl.events.register(eventName, this, createEventAction("selectionManager.modifyControl", eventName));
    }
    for (var i = 0; i < possibleSelectionEvents.length; i++) {
        var eventName = possibleSelectionEvents[i];
        Waze.selectionManager.events.register(eventName, this, createEventAction("selectionManager", eventName));
    }
    for (var i = 0; i < possibleSelectionModifyHoverEvents.length; i++) {
        var eventName = possibleSelectionModifyHoverEvents[i];
  //      selectionManager.modifyControl.featureHover.control.events.register(eventName, this, createEventAction("selectionManager.modifyControl.featureHover.control", eventName));
    }
	for (var i = 0; i < possibleActionEvents.length; i++) {
		var eventName = possibleActionEvents[i];
		Waze.model.actionManager.events.register(eventName, this, createEventAction("Waze.model.actionManager", eventName));
	}
	Waze.selectionManager.selectControl.events.register("featurehighlighted", this, createHighlighAction("selectionManager.selectControl", "featurehighlighted"));
    
    var loadEventFunction = createEventAction("Waze.controller.events", "loadend");
    Waze.controller.events.register("loadend", this, function(e) {
        console.log("Clearing node manager");
        NodeManager.clear();
        SegmentManager.clear();
        loadEventFunction.call();
    });
    Waze.model.actionManager.events.register("afteraction", this, function(e) {
        console.log("Clearing node manager");
        NodeManager.clear();
        SegmentManager.clear();
        loadEventFunction.call();
    });


    if(DEBUG) {
//        Waze.selectionManager.registerModelEvents("selectionChanged", this, function(){console.log("sm.blur")});
        Waze.selectionManager.events.register("touchstart", this, function(){console.log("sm.mc.touchstart")});
        //Waze.selectionManager.layers[0].events.register("beforefeatureselected", this, function(){console.log("sm.mc.beforefeatureselected")});
        // Waze.selectionManager.selectControl.events.register("featurehighlighted", this, function(e){console.log("sm.mc.featurehighlighted : ");});
//        selectionManager.modifyControl.featureHover.control.events.register("activate", this, function(){console.log("sm.mc.fh.c.activate")});
//        selectionManager.modifyControl.featureHover.control.events.register("mouseover", this, function(){console.log("sm.mc.fh.c.mouseover")});
//        selectionManager.modifyControl.featureHover.register("over", this, function(){console.log("sm.mc.fh.-e.over")});
    }
}

debug("registering for events for when window is marked as loaded");
if(document.readyState === "complete") {
    debug("Already Loaded");
    loadFunction("");
}
else {
    window.addEventListener("load", loadFunction);
    Waze.app._events.register("change:loading", loadFunction);
}
// trigger code when page is fully loaded, to catch any missing bits


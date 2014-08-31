
////  UTIL FUNCTIONS
function extend(target, source) {
    var hasOwnProperty = Object.prototype.hasOwnProperty;
    for (var propName in source) {
        // Invoke hasOwnProperty() with this = source
        if (hasOwnProperty.call(source, propName)) {
            target[propName] = source[propName];
        }
    }
    return target;
}

if (!Array.prototype.filter)
{
  Array.prototype.filter = function(fun /*, thisArg */)
  {
    "use strict";

    if (this === void 0 || this === null)
      throw new TypeError();

    var t = Object(this);
    var len = t.length >>> 0;
    if (typeof fun !== "function")
      throw new TypeError();

    var res = [];
    var thisArg = arguments.length >= 2 ? arguments[1] : void 0;
    for (var i = 0; i < len; i++)
    {
      if (i in t)
      {
        var val = t[i];

        // NOTE: Technically this should Object.defineProperty at
        //       the next index, as push can be affected by
        //       properties on Object.prototype and Array.prototype.
        //       But that method's new, and collisions should be
        //       rare, so use the more-compatible alternative.
        if (fun.call(thisArg, val, i, t))
          res.push(val);
      }
    }

    return res;
  };
}

function getScaledHex(index, maximum, startColor, endColor) {
    if (index >= maximum) {
        index = maximum - 1;
    }
    var colorVal = startColor + ((endColor - startColor) * (index / (maximum - 1)));

    colorVal = Math.round(colorVal);

    // convert from decimal to hexadecimal
    var colorHex = colorVal.toString(16);

    // pad the hexadecimal number if required
    if (colorHex.length < 2) {
        colorHex = "0" + colorHex;
    }
    return colorHex;
}

function getScaledColour(index, maximum) {
    var blueHex = "00";

    var startGreen = 0;
    var endGreen = 255;

    var startRed = 255;
    var endRed = 0;

    return "#" + getScaledHex(index, maximum, startRed, endRed) + getScaledHex(index, maximum, startGreen, endGreen) + blueHex;
}

function generateTopDownGradient(top, bottom) {
    var stylizer = "background-color: " + top + ";"
    stylizer += "background-image: -webkit-gradient(linear, left top, left bottom, color-stop(0%," + top + "), color-stop(100%, " + bottom + "));";
    stylizer += "background-image: -webkit-linear-gradient(top, " + top + ", " + bottom + ");";
    stylizer += "background-image: -moz-linear-gradient(top, " + top + ", "  + bottom + ");";
    stylizer += "background-image: -ms-linear-gradient(top, " + top + ", " + bottom + ");";
    stylizer += "background-image: -o-linear-gradient(top, " + top + ", " + bottom + ");";
    stylizer += "background-image: linear-gradient(top, " + top + ", " + bottom + ");";
    return stylizer;
}

function padNumber(numDigits, number) {
   var startNum = Math.pow(10, numDigits) / 10;
   var numStr = "" + number;
   while(number < startNum  && startNum > 1) {
	  numStr = "0" + numStr;
	  startNum /= 10;
   }
   return numStr;
}

function dateToDateString(dateVal) {
    return "" + dateVal.getFullYear() + "/" + padNumber(2, dateVal.getMonth()+1) + "/" + padNumber(2, dateVal.getDate());
}

function lengthToString(lengthInMeters) {
    return Math.round(lengthInMeters * 3.28084) + " ft"
}

function calcTan(dLon, dLat) {
 return (Math.atan(dLon/dLat) / (2 * Math.PI)) * 360;
}

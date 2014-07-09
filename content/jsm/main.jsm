var EXPORTED_SYMBOLS = ["exports"];

var wps = {};

wps.addWindow = function(winn) {
  winn.setTimeout(function() { winn.alert('hi wps'); }, 3000);
};

var exports = wps;
var EXPORTED_SYMBOLS = ["exports"];

var wps = (function() {
  var scope = {};
  Components.utils.import("resource://gre/modules/Services.jsm", scope);
  scope.Services.console.logStringMessage('construct');    

  var self = {};

  self.cleaners = [];

  self.log = function(msg) {
    scope.Services.console.logStringMessage(msg);    
  };

  self.runIndexing = function(event) {
    var doc = (!! event.target.ownerDocument) ? event.target.ownerDocument : event.target;

    var evt = doc.createEvent("CustomEvent");
    evt.initCustomEvent("wps-index", true, false, {});
    doc.dispatchEvent(evt);            

  };

  self.addWindow = function(winn) {
    //winn.setTimeout(function() { winn.alert('hi wps'); }, 3000);

    var document = winn.document;

    var gcm = winn.gContextMenu;

    var contextMenu = document.querySelector("#contentAreaContextMenu");
    var fmenuitem = document.createElement("menuitem");
    fmenuitem.setAttribute("label", "WPSEARCH");
    contextMenu.appendChild(fmenuitem);
    this.cleaners.push(function() { contextMenu.removeChild(fmenuitem); });

    fmenuitem.addEventListener("click", function(event) {
      self.log("query");

      var evt = document.createEvent("CustomEvent");
      evt.initCustomEvent("foobar", true, false, {});
      document.dispatchEvent(evt);            

      [winn.gContextMenu].forEach(function(gcm) {
        try {
        console.log(JSON.stringify({gcm: Object.keys(gcm),nullo:!!gcm}));
        } catch (ee) {
          self.log("EE: " + JSON.stringify({ee:ee,msg:ee.message,nullo:[true,!!gcm]}));
        }
      });

      var query = document.defaultView.prompt("WAS??");
      self.log("QUERY: " + query);
    }, false);

    var appcontent = winn.document.getElementById('appcontent');
    appcontent.addEventListener("DOMContentLoaded", function(event) {
        //self.runIndexing(event);
    }, false);
    appcontent.addEventListener("load", function(event) {
        //self.runIndexing(event);
    }, false);
  };

  self.cleanup = function() {
    this.cleaners.forEach(function(cleanup) {
      cleanup.call(this);
    });
    this.cleaners = [];
  };            

  self.init = function() {
  };

  return self;
}());


var exports = wps;

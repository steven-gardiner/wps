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

    if (doc.wps) { return; }

    doc.wps = doc.wps || {};

    doc.defaultView.setTimeout(function() {
        doc.defaultView.alert(event.type);
      }, 1000);

    var body = doc.querySelector("body");

    var texts = [];
    var walker = doc.createTreeWalker(body, 
                                      doc.defaultView.NodeFilter.SHOW_ALL,
                                      null, 
                                      true);
    while (walker.nextNode()) {
      var curr = walker.currentNode;
      if (curr.nodeType === curr.TEXT_NODE) {
        texts.push(curr.nodeValue);
      }
    }
    self.log("TXT: " + texts.slice(-10,-1).join("\n"));

    var rng = doc.createRange();
    rng.setStart(body,0);
    rng.setEnd(body,10);

    self.log("RNG: " + rng.toString());

    var sln = doc.defaultView.getSelection();
    sln.removeAllRanges();
    sln.addRange(rng);

  };

  self.expandRange = function(rng) {
    try {
      rng.setEnd(rng.endContainer, rng.endOffset+1);
    } catch (ise) {
      self.log(JSON.stringify(ise));
      rng.setEndAfter(rng.endContainer);
    }
    return rng;
  };

  self.addWindow = function(winn) {
    //winn.setTimeout(function() { winn.alert('hi wps'); }, 3000);

    var document = winn.document;

    var gcm = winn.gContextMenu;

    var contextMenu = document.querySelector("#contentAreaContextMenu");
    var menuitem = document.createElement("menuitem");
    menuitem.setAttribute("label", "Expand Selection");
    contextMenu.appendChild(menuitem);
    this.cleaners.push(function() { contextMenu.removeChild(menuitem); });

    contextMenu.addEventListener("popupshowing", function(event) {
        self.log("CONTEXT");
        self.log(winn.gContextMenu.target.outerHTML);
        self.log(JSON.stringify(Object.keys(winn.gContextMenu)));
    }, false);
    menuitem.addEventListener("click", function(event) {
      self.log("rightwards ho");

      var doc = winn.gContextMenu.target.ownerDocument;
      var sln = doc.defaultView.getSelection();
      var rng0 = sln.getRangeAt(0);
      var rng1 = self.expandRange(rng0);
      sln.removeAllRanges();
      sln.addRange(rng1);
        
    }, false);

    var appcontent = winn.document.getElementById('appcontent');
    appcontent.addEventListener("DOMContentLoaded", function(event) {
      self.runIndexing(event);
    }, false);
    appcontent.addEventListener("load", function(event) {
      self.runIndexing(event);
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

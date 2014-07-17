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

  self.gobbleLetter = function(rng) {
    var ec = rng.endContainer;
    //self.log(JSON.stringify({EXPAND: ec.nodeType, ELEMENT_NODE: ec.ELEMENT_NODE}));
    switch (ec.nodeType) {   
      case ec.ELEMENT_NODE: //ELEMENT_NODE 
        self.log("ELT: " + JSON.stringify({endoffset:rng.endOffset,txt:rng.toString(),elt:ec.outerHTML}));
        if (ec.childNodes.length > rng.endOffset) {
          var kid = ec.childNodes[rng.endOffset];
          rng.setEnd(kid,0);
        } else {
          rng.setEndAfter(ec);
        }       
        return self.gobbleLetter(rng);
      default:   
        try {        
          rng.setEnd(ec, rng.endOffset+1);
        } catch (ise) {
          self.log(JSON.stringify(ise));
          rng.setEndAfter(ec);
          return self.gobbleLetter(rng);
        }
    }
    return rng;
  };

  self.gobbleWord = function(rng, terminator) {
    terminator = terminator || /[\s]/;

    rng = self.gobbleLetter(rng);  

    var rng2 = rng.cloneRange();
    rng2.selectNodeContents(rng.endContainer);
    rng2.setStart(rng.endContainer,rng.endOffset);

    var txt = rng2.toString();
    var tokens = txt.split(terminator);
    
    self.log('rng2: ' + JSON.stringify({txt:txt,tokens:tokens,now:rng2.toString()}));
    if (tokens.length > 1) {
      rng.setEnd(rng.endContainer,rng.endOffset+tokens[0].length);
    } else {
      rng.setEnd(rng.endContainer,rng.endOffset+tokens[0].length);
      return self.gobbleWord(rng, terminator);
    }      

    return rng;

    terminator = terminator || /[\s]$/;

    while (rng.toString().match(terminator)) {
      self.log(JSON.stringify({PRE: rng.toString()}));
      rng = self.gobbleLetter(rng);
    }   

    var rng0 = rng.cloneRange();
    rng = self.gobbleLetter(rng);    
    while (! rng.toString().match(terminator)) {      
      rng0 = rng.cloneRange();
      rng = self.gobbleLetter(rng);        
      self.log(JSON.stringify({POST: rng.toString()}));
    }   
    self.log(JSON.stringify({DONE: rng0.toString(), rng: rng.toString()}));
    return rng0;
  };

  self.addWindow = function(winn) {
    //winn.setTimeout(function() { winn.alert('hi wps'); }, 3000);

    var document = winn.document;

    var gcm = winn.gContextMenu;

    var contextMenu = document.querySelector("#contentAreaContextMenu");
    var lmenuitem = document.createElement("menuitem");
    lmenuitem.setAttribute("label", "Gobble Letter");
    contextMenu.appendChild(lmenuitem);
    this.cleaners.push(function() { contextMenu.removeChild(lmenuitem); });

    var wmenuitem = document.createElement("menuitem");
    wmenuitem.setAttribute("label", "Gobble Word");
    contextMenu.appendChild(wmenuitem);
    this.cleaners.push(function() { contextMenu.removeChild(wmenuitem); });

    contextMenu.addEventListener("_popupshowing", function(event) {
        self.log("CONTEXT");
        self.log(winn.gContextMenu.target.outerHTML);
        self.log(JSON.stringify(Object.keys(winn.gContextMenu)));
    }, false);
    lmenuitem.addEventListener("click", function(event) {
      self.log("rightwards ho");

      var doc = winn.gContextMenu.target.ownerDocument;
      var sln = doc.defaultView.getSelection();
      var rng0 = sln.getRangeAt(0);
      var rng1 = self.gobbleLetter(rng0);
      sln.removeAllRanges();
      sln.addRange(rng1);
        
    }, false);
    wmenuitem.addEventListener("click", function(event) {
      self.log("rightwards ho");

      var doc = winn.gContextMenu.target.ownerDocument;
      var sln = doc.defaultView.getSelection();
      var rng0 = sln.getRangeAt(0);
      var rng1 = self.gobbleWord(rng0);
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

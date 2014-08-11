var stemmer = stemmer || null;

var wps = function(document) {
  var self = {};

  var privy = {};

  self.stem = stemmer || function(word) { return word; };

  self.document = document;

  privy.sln = document.defaultView.getSelection();

  self.log = function(msg) {
    console.log(msg);
  };

  self.indexDocument = function() {
    if (self.indexed) { return; }

    try {
      var rng = self.advanceRange({doc:document,windowSize:50});

      var detail = {rng:rng, selection:privy.sln};

      var evt = self.document.createEvent("CustomEvent");
      evt.initCustomEvent("wps-index-passage", true, false, detail);
      self.document.dispatchEvent(evt);            

      //privy.sln.removeAllRanges();
      //privy.sln.addRange(rng);  
    } catch (ee) {
      // log ee
      self.indexed = true;
      self.log("DONEDONE");
    }
    setTimeout(self.indexDocument, 0);
  };

  privy.rangeSeq = 0;
  self.nextRangeId = function() {
    privy.rangeSeq++;
    return ["RANGE",["00000000",privy.rangeSeq].join("").slice(-8)].join("");
  };

  self.indexRange = function(rng) {
    if (! self.index) {
      self.index = {};
      self.index.invList = {};
      self.index.N = 0;
      self.index.ranges = {};
      jQuery(self.document).data('index', self.index);
    }

    self.index.N++;
    var rangeID = self.nextRangeId();
    var txt = rng.toString();
    self.index.ranges[rangeID] = {range:rng,text:txt};
    var words = txt.split(/\s+/);
    words = words.map(function(word) { 
        var out = word.replace(/\W+\s*$/,''); 
        //if (out !== word) { console.log("DELTA: |" + word + "| --> |" + out + "|"); }
        return out; 
      }).map(String.toLowerCase);
    var stems = words.map(self.stem);
    stems.forEach(function(token) {
      if (! self.index.invList[token]) {
        self.index.invList[token] = [];
      }
      self.index.invList[token].push({rangeid:rangeID});
    });
    //self.log(JSON.stringify({foo:7,index: Object.keys(self.index).length}));
  };

  self.advanceRange = function(spec) {
    if (! self.currentRange) {
      var body = spec.doc.querySelector("body");
      self.previousRange = spec.doc.createRange();
      self.previousRange.setStart(body,0);
      self.previousRange.setEnd(body,0);
      for (var i = 0; i < Math.floor(spec.windowSize / 2); i++) {
        self.previousRange = self.gobbleWord(self.previousRange);
      }

      self.currentRange = self.previousRange.cloneRange();
      for (var i = 0; i < Math.ceil(spec.windowSize / 2); i++) {
        self.currentRange = self.gobbleWord(self.currentRange);
      }

      return self.currentRange;      
    }   

    var rng0 = self.previousRange;
    self.previousRange = self.currentRange.cloneRange();
    self.currentRange.setStart(rng0.endContainer, rng0.endOffset);
    for (var i = 0; i < Math.ceil(spec.windowSize / 2); i++) {
      self.currentRange = self.gobbleWord(self.currentRange);
    }

    return self.currentRange;
  };

  self.gobbleWord = function(rng, spec) {
    spec = spec || {};
    spec.terminator = spec.terminator || /([\s])/;


    rng = self.fixRange(rng);
    var txt0 = rng.toString();

    var rng2 = rng.cloneRange();
    rng2.selectNodeContents(rng.endContainer);
    rng2.setStart(rng.endContainer,rng.endOffset);

    var txt = rng2.toString();

    if (txt.length === 0) {
      rng.setEndAfter(rng2.endContainer);
      return self.gobbleWord(rng, spec);
    }   

    var tokens0 = txt0.split(spec.terminator);
    var tokens = txt.split(spec.terminator);
    //self.log("GOBBLE: " + JSON.stringify({spec:spec,txt0:txt0,txt:txt,tokens0:tokens0,tokens:tokens}));
    switch (tokens.length) {
      case 0:
        //self.log("ZERO: " + JSON.stringify({tokens:tokens}));
        break;
      case 1:
        //self.log("ONE:  " + JSON.stringify({tokens:tokens,txt:txt}));
        rng.setEndAfter(rng2.endContainer);
        spec.sated = spec.sated || (tokens0.slice(-1)[0] === '');
        return spec.sated ? rng : self.gobbleWord(rng, spec);
        break;
      case 2:
        //self.log("TWO:  " + JSON.stringify({tokens:tokens}));
        if (tokens[0].length > 0) {   
          var suffix = tokens[0];
          rng.setEnd(rng.endContainer,rng.endOffset + suffix.length);        
        } else {
          
        }       
        break;        
      default:
        //self.log("3+:   " + JSON.stringify({tokens:tokens,txt:txt}));
        if (tokens[0].length > 0) {   
          var suffix = tokens[0];
          rng.setEnd(rng.endContainer,rng.endOffset + suffix.length);        
        } else {
          var suffix = tokens.slice(0,3).join("");          
          rng.setEnd(rng.endContainer,rng.endOffset + suffix.length);        
          if (tokens[2].length > 0) {
          } else {
            var spec2 = Object.create(spec);
            spec2.sated = true;
            return self.gobbleWord(rng, spec2);
          }
        }       
    }

    return rng;
  };

  self.fixRange = function(rng) {
    var ec = rng.endContainer;
    //self.log(JSON.stringify({fixx:rng.toString(),nodeType: ec.nodeType,ec: ec.outerHTML,off:rng.endOffset}));
    switch (ec.nodeType) {
      case ec.ELEMENT_NODE:
        if (ec.childNodes.length > rng.endOffset) {
          var kid = ec.childNodes[rng.endOffset];
          var rng2 = rng.cloneRange();
          rng2.selectNode(kid);
          //self.log(JSON.stringify({kid:rng2.toString()}));
          rng.setEnd(kid,0);          
        } else {
          rng.setEndAfter(ec);          
        }
        return self.fixRange(rng);
    }
    //self.log(JSON.stringify({fixxed:rng.toString()}));
    return rng;
  };

  self.computeScoreContribution = function(spec) {
    return spec.tf * spec.idf;
  };

  self.combineScoreContributions = function(contribs) {
    return contribs.reduce(function(accum, contrib) { return accum + contrib; }, 0.0);
  };

  self.compareScores = function(a,b) {
    if (Math.abs(a.score - b.score) > 0.0) {
      return b.score - a.score;
    }
    return (b.rangeid < a.rangeid);
  };

  jQuery(self.document).on('query', function(event, detail) {
    detail = detail || event.detail || (event.originalEvent && event.originalEvent.detail);   

    var words = detail.query.split(/\s+/).map(String.toLowerCase);
    console.log("QUERYWORDS: " + JSON.stringify({words:words}));
    var stems = words.map(self.stem);
    console.log("QUERYSTEMS: " + JSON.stringify({words:words,stems:stems}));
    var candidates = {};
    var results = [];   
    self.index.logN = Math.log(self.index.N);
    console.log("N: " + JSON.stringify({N:self.index.N,logN:self.index.logN}));
    stems.forEach(function(stem) {
        var entries = self.index.invList[stem] || [];
        var df = entries.length;        
    });
    

    candidates = stems.reduce(function(accum, stem) {
      var entries = self.index.invList[stem] || [];
      var idf = self.index.logN - Math.log(1+entries.length);
      entries.forEach(function(entry) {
        if (! accum[entry.rangeid]) {
          accum[entry.rangeid] = [];
        }
        accum[entry.rangeid].push(self.computeScoreContribution({stem:stem,idf:idf,tf:1}))
      });  
      return accum;
    }, {});

    results = Object.keys(candidates).map(function(rangeid) {
      return {rangeid:rangeid,score:self.combineScoreContributions(candidates[rangeid])};
    });
    results.sort(self.compareScores);

    console.log("QUERYUMMMS: " + JSON.stringify({words:words,stems:stems,results:results
            //,candidates:candidates
            }));

    var index = self.index;
    //console.log("INDEX: " + JSON.stringify(Object.keys(index), null, 2));

    console.log("QUERY ME: " + JSON.stringify({detail:detail,foo:12}));
  });
  jQuery(self.document).on('click', function(event) {
      console.log("CLICK ME!");
  });

  jQuery(self.document).on('wps-index-passage', function(event, detail) {
    var doc = (!! event.target.ownerDocuent) ? event.target.ownerDocument : event.target;
    detail = detail || event.detail || event.originalEvent.detail;
  
    doc.wps.indexRange(detail.rng);
  });

  return self;
};

jQuery(document).find("#appcontent").on("DOMContentLoaded.wps load.wps", function(event) {
  var doc = (!! event.target.ownerDocument) ? event.target.ownerDocument : event.target;
  
  doc.wps = new wps(doc);
  doc.defaultView.setTimeout(function() {
    doc.wps.indexDocument();
  }, 100);
});

document.addEventListener('wps-index', function(event) {
  var doc = (!! event.target.ownerDocuent) ? event.target.ownerDocument : event.target;

  doc.wps = new wps(doc);
  doc.defaultView.setTimeout(function() {
    doc.wps.indexDocument();
  }, 100);
}, false);

var ui = {};
ui.wgcm = window.gContextMenu;
ui.gcm = gContextMenu;

jQuery(document).on('query.wps', function(event) {
  console.log("FOOFOO");
});
jQuery(document).on('insert-mozilla-ui.wps', function(event) {
  console.log("FOO");

  var contextMenu = document.querySelector("#contentAreaContextMenu");
  ui.fmenuitem = document.createElement("menuitem");
  ui.fmenuitem.setAttribute("label", "WPSEARCHTOO");
  contextMenu.appendChild(ui.fmenuitem);
  console.log("BAR");

  jQuery(ui.fmenuitem).on('click', function(event) {
    var gcm = gContextMenu;
    [gContextMenu, window.gContextMenu, document.defaultView.gContextMenu,ui.wgcm,ui.gcm].forEach(function(gcm) {
        try {
          console.log(JSON.stringify({gcm: Object.keys(gcm),nullo:!!gcm,tgt:!!gcm.target}));
        } catch (ee) {
          console.log("EE: " + JSON.stringify({ee:ee,msg:ee.message,nullo:[true,!!gcm]}));
        }
    });
    var query = document.defaultView.prompt("WAS??");
    jQuery(gcm.target).trigger('query', {query:query});
    jQuery(gcm.target).css({opacity:0.2});
    console.log(JSON.stringify({tgt:gcm.target.outerHTML}));
  });
});

jQuery(document).on('cleanup-mozilla-ui.wps', function(event) {
  console.log("FOO");

  jQuery(ui.fmenuitem).detach();  
  jQuery(document).off('.wps');

  console.log("BAR");
});


if (true) {
  jQuery(document).on('wps-index-passage.wps', function(event, detail) {
    var doc = (!! event.target.ownerDocuent) ? event.target.ownerDocument : event.target;
    detail = detail || event.detail || event.originalEvent.detail;
  
    //console.log("PSG0!");
    //console.log("PSG0: " + JSON.stringify(detail));
 
    detail.selection.removeAllRanges();
    detail.selection.addRange(detail.rng);  
  });
 }

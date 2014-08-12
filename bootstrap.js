const { classes: Cc, interfaces: Ci, utils: Cu } = Components;

Components.utils.import("resource://gre/modules/Services.jsm");
Components.utils.import("resource://gre/modules/AddonManager.jsm");

var boot = {};
boot.onOpenWindow = function(aWindow) {
  let domWindow = aWindow.QueryInterface(Ci.nsIInterfaceRequestor).getInterface(Ci.nsIDOMWindowInternal || Ci.nsIDOMWindow);  
  domWindow.onLoad = function listener() {
    domWindow.removeEventListener("load", domWindow.onLoad, false);

      // If this is a browser window then setup its UI
    if (domWindow.document.documentElement.getAttribute("windowtype") == "navigator:browser") {
      var callback = function() {
        if (boot.modules) {
          boot.injectModules(domWindow);
          boot.emit(domWindow.document, "insert-mozilla-ui");    
        } else {
          domWindow.setTimeout(callback, 100);
        }
      };
      callback.call();
    }
        
  };
  domWindow.addEventListener("load", domWindow.onLoad, false);
};
boot.onCloseWindow = function(aWindow) { };
boot.onWindowTitleChange = function() { };

function startup(data,reason) {
  let windows = Services.wm.getEnumerator("navigator:browser");
  while (windows.hasMoreElements()) {
    let domWindow = windows.getNext().QueryInterface(Ci.nsIDOMWindow);
    var callback = function() {
      if (boot.modules) {
        boot.injectModules(domWindow);
        boot.emit(domWindow.document, "insert-mozilla-ui");
      } else {
        domWindow.setTimeout(callback, 100);
      }
    };
    callback.call();
  }

  Services.wm.addListener(boot);

  AddonManager.getAddonByID(data.id, function(addon) {
      
    var urlparts = addon.optionsURL.split(/\//);

    var extname = urlparts[2];

    var extprefix = urlparts.slice(0,3);
    var jsurl = extprefix.concat(["content",
                                  "js",
                                  "main.js"]).join('/');

    var ioService = Components.classes["@mozilla.org/network/io-service;1"]
      .getService(Components.interfaces.nsIIOService);
    var styleService = Components.classes["@mozilla.org/content/style-sheet-service;1"]
      .getService(Components.interfaces.nsIStyleSheetService);

    boot.modules = [];
    boot.windows = [];
    boot.emit = function(doc, eventType) {
      var evt = doc.createEvent("CustomEvent");
      evt.initCustomEvent(eventType, true, false, {});
      doc.dispatchEvent(evt);    
    };
    boot.require = function(module) {
      boot.modules.push(module);
    };
    boot.injectStylesheet = function(loc, handler) {
      if (! handler) { 
        handler = function(err) { 
          Services.console.logStringMessage(err);           
        }; 
      }
      try {
        var uristr = extprefix.concat(["skin",loc]).join("/");
        var uri = ioService.newURI(uristr, null, null);
        if (! styleService.sheetRegistered(uri, styleService.AGENT_SHEET)) {
          styleService.loadAndRegisterSheet(uri, styleService.AGENT_SHEET);
        }      
      } catch (err) {
        handler(err);
      }
    };
    boot.handleStylesheet = function(event,detail) {
      detail = detail || event.detail || (event.originalEvent && event.originalEvent.detail);
      boot.injectStylesheet(detail.stylesheet);
    };
    boot.injectModules = function(window) {
      window.document.addEventListener('register-stylesheet', boot.handleStylesheet, false);
      window.env = boot.env;
      boot.modules.forEach(function(module) {
        boot.inject(module, window);
      });
      boot.windows.push(window);
    };
    boot.inject = function(module, window, handler) {
      var modurl = addon.optionsURL.split(/\//).slice(0,3).join("/") + module;
      if (! handler) { 
        handler = function(err) { 
          Services.console.logStringMessage(err);           
        }; 
      }
      try {
        Services.scriptloader.loadSubScript(modurl, window, "UTF-8");
      } catch (err) {
        handler(err);
      }
    };
    boot.cleanup = function() {
      boot.windows.forEach(function(window) {
        boot.emit(window.document, "cleanup-mozilla-ui");          
        window.document.removeEventListener('register-stylesheet', boot.handleStylesheet, false);
      });
      boot.windows = [];
      delete boot.modules;
    };
    boot.env = {};
    boot.env.extname = extname;

    try {
      Services.scriptloader.loadSubScript(jsurl, boot, "UTF-8");
    } catch (ee) {
      Services.console.logStringMessage(ee); 
    }

  });

}

function shutdown(data, reason) {
  boot.cleanup();

  Services.wm.removeListener(boot);
  boot = null;
}

function install(data, reason) {
}

function uninstall(data, reason) {
}


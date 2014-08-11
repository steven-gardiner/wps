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
        if (boot.exports) {
          if (boot.exports.addWindow) {
            boot.exports.addWindow(domWindow);
          }
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
      if (boot.exports) {
        if (boot.exports.addWindow) {
          boot.exports.addWindow(domWindow);
        }
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
      
    var jsmurl = addon.optionsURL.split(/\//).slice(0,3).concat(["content",
                                                                 "jsm",
                                                                 "main.jsm"]).join('/');
    var jsurl = addon.optionsURL.split(/\//).slice(0,3).concat(["content",
                                                                "js",
                                                                "main.js"]).join('/');

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
    boot.injectModules = function(window) {
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
      });
    };

    try {
      Services.scriptloader.loadSubScript(jsurl, boot, "UTF-8");
    } catch (ee) {
      Services.console.logStringMessage(ee); 
    }
    Components.utils.import(jsmurl, boot);
    if (boot.exports.init) {
      boot.exports.init();
    }
  });

}

function shutdown(data, reason) {
  if (boot.exports.cleanup) {
    boot.exports.cleanup();
  }
  boot.cleanup();

  Services.wm.removeListener(boot);
}

function install(data, reason) {
}

function uninstall(data, reason) {
}


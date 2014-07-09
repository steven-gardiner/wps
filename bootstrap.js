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
        boot.exports.addWindow(domWindow);
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

  Services.wm.removeListener(boot);
}

function install(data, reason) {
}

function uninstall(data, reason) {
}


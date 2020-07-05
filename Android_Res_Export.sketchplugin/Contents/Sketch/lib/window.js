
var MochaJSDelegate = require("../lib/MochaJSDelegate");
var localizedString = require("../lib/localizedString");
var preferences = require("../lib/preferences");
var io = require("../lib/io");

var getPreferences = preferences.getPreferences;
var pasteboardCopy = io.pasteboardCopy;

function window(context, title, htmlPath, didFinishLoadFunction, didChangeLocationFunction) {

    var windowWidth = 720,
        windowHeight = 480;
    var window = NSWindow.alloc().init();
    window.setTitle(title);
    window.setFrame_display(NSMakeRect(0, 0, windowWidth, windowHeight), false);
    window.setStyleMask(NSTitledWindowMask | NSClosableWindowMask);
    window.standardWindowButton(NSWindowMiniaturizeButton).setHidden(true);
    window.standardWindowButton(NSWindowZoomButton).setHidden(true);

    var closeButton = window.standardWindowButton(NSWindowCloseButton);
    closeButton.setCOSJSTargetFunction(function(sender) {
        NSApp.stopModal();
        NSApp.endSheet(window);
        context.document.documentWindow().makeKeyAndOrderFront(nil);
    });

    var webView = WebView.alloc().initWithFrame(NSMakeRect(0, 0, windowWidth, windowHeight - 22));
    webView.setBackgroundColor(NSColor.colorWithRed_green_blue_alpha(248/255, 248/255, 248/255, 1));
    var scriptObject = webView.windowScriptObject();

    var delegate = new MochaJSDelegate({
        "webView:didFinishLoadForFrame:": (function(webView, webFrame) {
            didFinishLoadFunction(scriptObject);
        }),
        "webView:didChangeLocationWithinPageForFrame:": (function(webView, webFrame) {
            var locationHash = scriptObject.evaluateWebScript("window.location.hash");
            if (/^#windowOnFocus_.*/.test(locationHash)) {
                if (window.currentEvent().window() == window) {
                    var point = window.currentEvent().locationInWindow();
                    var x = point.x;
                    var y = windowHeight - point.y - 24;
                    scriptObject.evaluateWebScript("clickAtPoint(" + x + ", " + y + ")");
                }
            }
            didChangeLocationFunction(window, locationHash);
        })
    });
    webView.setFrameLoadDelegate_(delegate.getClassInstance());
    webView.setMainFrameURL_(context.plugin.urlForResourceNamed(htmlPath).path());

    window.contentView().addSubview(webView);
    window.center();

    return NSApp.runModalForWindow(window);
}

function showCodeWindow(context, code, saveAction) {
    window(
        context,
        localizedString(context, "code_preview"),
        "code_preview.html",
        function(scriptObject) {

            // Translation HTML
            var currentLanguageSetting = getPreferences(context, "language");
            if (currentLanguageSetting != "en") {
                var languageJSON = {
                    "cancel": localizedString(context, "cancel"),
                    "save": localizedString(context, "save"),
                    "copy": localizedString(context, "copy")
                };
                scriptObject.evaluateWebScript('i18n(' + JSON.stringify(languageJSON) + ')');
            }

            var codeForHTML = code.replace(/\n/g, "\\n");
            scriptObject.evaluateWebScript("previewCode('" + codeForHTML + "')");
        },
        function(nswindow, locationHash) {

            if (locationHash == "#save") {
                NSApp.stopModal();
                NSApp.endSheet(nswindow);
                context.document.documentWindow().makeKeyAndOrderFront(nil);

                saveAction(code);
            }

            if (locationHash == "#cancel") {
                NSApp.stopModal();
                NSApp.endSheet(nswindow);
                context.document.documentWindow().makeKeyAndOrderFront(nil);
            }

            if (locationHash == "#copy") {
                pasteboardCopy(code);
            }
        }
    );
}

module.exports.showCodeWindow = showCodeWindow;

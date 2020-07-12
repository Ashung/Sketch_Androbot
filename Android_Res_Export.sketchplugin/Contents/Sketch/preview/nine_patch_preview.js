var ga = require("../lib/google_analytics");
var message = require("../lib/message");
var localizedString = require("../lib/localizedString");
var layer = require("../lib/layer");
var window = require("../lib/window");
var preferences = require("../lib/preferences");

var toast = message.toast;
var getLayerWithNameFromParent = layer.getLayerWithNameFromParent;
var showHtmlWindow = window.showHtmlWindow;
var getPreferences = preferences.getPreferences;

var onRun = function(context) {

    ga(context, "Preview", "nine_patch_preview");

    var selection = context.selection;
    if (selection.count() == 0 || selection.count() > 1) {
        toast(context, localizedString(context, "select_one_nine_patch_asset"));
        return;
    }

    // Checking nine-patch
    var selectedLayer = selection.firstObject();
    var ninePatch;
    if (selectedLayer.class() == "MSLayerGroup" || selectedLayer.class() == "MSArtboardGroup" || selectedLayer.class() == "MSSymbolMaster") {
        if (
            selectedLayer.layers().count() == 2 &&
            getLayerWithNameFromParent("patch", selectedLayer) &&
            getLayerWithNameFromParent("content", selectedLayer)
        ) {
            if (
                getLayerWithNameFromParent("patch", selectedLayer).layers().count() >= 4 &&
                getLayerWithNameFromParent("#9patch", getLayerWithNameFromParent("content", selectedLayer)).class() == "MSSliceLayer"
            ) {
                ninePatch = selectedLayer;
            }
            else {
                toast(context, localizedString(context, "nine_patch_layer_structure_is_wrong"));
                return;
            }
        }
        else {
            toast(context, localizedString(context, "select_one_nine_patch_asset"));
            return;
        }
    }
    else if (selectedLayer.class() == "MSSliceLayer" && selectedLayer.name() == "#9patch") {
        if (
            selectedLayer.parentGroup().name() == "content" &&
            selectedLayer.parentGroup().parentGroup().layers().count() == 2 &&
            getLayerWithNameFromParent("patch", selectedLayer.parentGroup().parentGroup())
        ) {
            if (getLayerWithNameFromParent("patch", selectedLayer.parentGroup().parentGroup()).layers().count() >= 4) {
               ninePatch = selectedLayer;
            }
            else {
               toast(context, localizedString(context, "nine_patch_layer_structure_is_wrong"));
               return;
            }
        }
        else {
            toast(context, localizedString(context, "nine_patch_asset_layer_format"));
            return;
        }
    }
    else {
        toast(context, localizedString(context, "select_one_nine_patch_asset"));
        return;
    }

    if (!ninePatch) {
        toast(context, localizedString(context, "select_one_nine_patch_asset"));
        return;
    }

    // Get base64 code of nine-patch asset
    var scale = 2;
    var exportRequest = MSExportRequest.exportRequestsFromExportableLayer_inRect_useIDForName(
        ninePatch, ninePatch.absoluteInfluenceRect(), false
    ).firstObject();
    exportRequest.setFormat("png");
    exportRequest.setScale(scale);
    var exporter = MSExporter.exporterForRequest_colorSpace(exportRequest, NSColorSpace.sRGBColorSpace());
    var base64 = exporter.data().base64EncodedStringWithOptions(nil);

    // Nine-patch width and height
    var ninePatchWidth = (ninePatch.frame().width() - 2) * scale;
    var ninePatchHeight = (ninePatch.frame().height() - 2) * scale;

    // Dialog
    showHtmlWindow(
        context,
        localizedString(context, "nine_patch_preview"),
        "nine_patch_preview.html",
        function(scriptObject) {

            // Translation HTML
            var currentLanguageSetting = getPreferences(context, "language");
            if (currentLanguageSetting != "en") {
                var languageJSON = {
                    "html_tip_bg_light": localizedString(context, "html_tip_bg_light"),
                    "html_tip_bg_dark": localizedString(context, "html_tip_bg_dark"),
                    "html_tip_bg_white": localizedString(context, "html_tip_bg_white"),
                    "html_label_width": localizedString(context, "html_label_width"),
                    "html_label_height": localizedString(context, "html_label_height"),
                    "html_label_content": localizedString(context, "html_label_content"),
                    "cancel": localizedString(context, "cancel"),
                    "export": localizedString(context, "export")
                };
                scriptObject.evaluateWebScript('i18n(' + JSON.stringify(languageJSON) + ')');
            }

            scriptObject.evaluateWebScript("var base64 ='" + base64 + "'");
            scriptObject.evaluateWebScript("originalWidth=" + ninePatchWidth + "");
            scriptObject.evaluateWebScript("originalHeight=" + ninePatchHeight + "");
            scriptObject.evaluateWebScript("drawNinePatch('" + base64 + "'," + ninePatchWidth + "," + ninePatchHeight + ",false)");
        },
        function(nswindow, locationHash) {

            // Export
            if (locationHash == "#export") {
                NSApp.stopModal();
                NSApp.endSheet(nswindow);
                context.document.documentWindow().makeKeyAndOrderFront(nil);
                NSApp.delegate().runPluginCommand_fromMenu_context(
                    context.plugin.commands().objectForKey("export_nine_patch"),
                    false,
                    context
                );
            }

            if (locationHash == "#cancel") {
                NSApp.stopModal();
                NSApp.endSheet(nswindow);
                context.document.documentWindow().makeKeyAndOrderFront(nil);
            }

        }
    );

};

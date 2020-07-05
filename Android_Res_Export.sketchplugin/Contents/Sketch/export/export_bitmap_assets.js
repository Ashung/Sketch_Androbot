var ga = require("../lib/google_analytics");
var message = require("../lib/message");
var localizedString = require("../lib/localizedString");
var preferences = require("../lib/preferences");
var io = require("../lib/io");
var common = require("../lib/common");

var toast = message.toast;
var getPreferences = preferences.getPreferences;
var chooseFolder = io.chooseFolder;
var showInFinder = io.showInFinder;
var directoryIsWriteable = io.directoryIsWriteable;
var dpiToScale = common.dpiToScale;
var assetName = common.assetName;

var onRun = function(context) {

    ga(context, "Export", "export_bitmap_assets");

    var doc = context.document;
    var selection = context.selection;
    var pluginIdentifier = context.command.identifier();

    var exportBitmapAssets;
    if (selection.count() > 0) {
        exportBitmapAssets = getBitmapAssetFromSelection(context);
    } else {
        exportBitmapAssets = getBitmapAssetFromDocument(context);
    }

    if (exportBitmapAssets.count() == 0) {
        toast(context, localizedString(context, "no_png_asset"));
        return;
    }

    var exportFolder = chooseFolder();
    if (exportFolder) {

        // ExportFolder is writeable
        if (!directoryIsWriteable(exportFolder)) {
            toast(context, localizedString(context, "cannot_export_to_folder"));
            return;
        }

        // Get export dpis
        var exportDpis = getPreferences(context, "export_dpis");
        if (!exportDpis) {
            exportDpis = Object.keys(DPIS);
        }

        var assetNameType = getPreferences(context, "asset_name_type");

        var loopExportAssets = exportBitmapAssets.objectEnumerator();
        var slice;
        while (slice = loopExportAssets.nextObject()) {

            var bitmapFormat = "png";
            if (pluginIdentifier == "export_bitmap_assets_webp") {
                bitmapFormat = "webp";
            }

            var ancestry = slice.ancestry();
            var exportRequest = MSExportRequest.exportRequestsFromLayerAncestry(ancestry).firstObject();
            exportRequest.setFormat(bitmapFormat);

            exportDpis.forEach(function(dpi) {
                exportRequest.setScale(dpiToScale(dpi));
                var filePath = exportFolder + "/drawable-" + dpi + "/" + assetName(slice, assetNameType) + "." + bitmapFormat;
                doc.saveExportRequest_toFile(exportRequest, filePath);
            });
        }

        toast(context, localizedString(context, "export_done"));

        if (getPreferences(context, "show_in_finder_after_export") == 1) {
            showInFinder(exportFolder);
        }

    }
};

function getBitmapAssetFromSelection(context) {
    var assets = NSMutableArray.alloc().init();
    var predicate = NSPredicate.predicateWithFormat(
        'className == "MSSliceLayer" && name != "#9patch" && (exportOptions.firstFormat == "png" || exportOptions.firstFormat == "webp")'
    );
    var selection = context.selection;
    selection.forEach(function(layer) {
        assets.addObjectsFromArray(layer.children().filteredArrayUsingPredicate(predicate));
    });
    return assets;
}

function getBitmapAssetFromDocument(context) {
    var predicate = NSPredicate.predicateWithFormat(
        'className == "MSSliceLayer" && name != "#9patch" && (exportOptions.firstFormat == "png" || exportOptions.firstFormat == "webp")'
    );
    return context.document.allExportableLayers().filteredArrayUsingPredicate(predicate);
}

var ga = require("../lib/google_analytics");
var message = require("../lib/message");
var localizedString = require("../lib/localizedString");
var preferences = require("../lib/preferences");
var layer = require("../lib/layer");
var io = require("../lib/io");

var toast = message.toast;
var getPreferences = preferences.getPreferences;
var getLayerWithNameFromParent = layer.getLayerWithNameFromParent;
var chooseFolder = io.chooseFolder;
var showInFinder = io.showInFinder;
var directoryIsWriteable = io.directoryIsWriteable;
var writeContentToFile = io.writeContentToFile;

var onRun = function(context) {

    ga(context, "Export", "export_app_icon");

    var doc = context.document;
    var page = doc.currentPage();

    if (!page.metadataForKey("is_android_app_icon_template")) {
        toast(context, localizedString(context, "current_page_is_no_template"));
        return;
    }

    // Android adaptive icon.
    var background = getLayerWithNameFromParent("ic_background", page),
        foreground = getLayerWithNameFromParent("ic_foreground", page);

    // Android app icon legacy.
    var iconNormal = getLayerWithNameFromParent("ic_launcher", page),
        iconRound = getLayerWithNameFromParent("ic_launcher_round", page);

    if (!background || !foreground || !iconNormal || !iconRound) {
        toast(context, localizedString(context, "app_icon_not_find"));
        return;
    }

    resizeArtboard(background, 108);
    resizeArtboard(foreground, 108);
    resizeArtboard(iconNormal, 192);
    resizeArtboard(iconRound, 192);

    // Export.
    var exportFolder = chooseFolder();
    if (exportFolder) {

        // ExportFolder is writeable
        if (!directoryIsWriteable(exportFolder)) {
            toast(context, localizedString(context, "cannot_export_to_folder"));
            return;
        }

        // Hide grid symbol instances
        var gridStatus = {};
        var gridForAdaptiveIcon = getLayerWithNameFromParent("grid_android_o", page);
        var gridForLegacyIcon = getLayerWithNameFromParent("grid", page);
        var predicate = NSPredicate.predicateWithFormat(
            "className == 'MSSymbolInstance' and (symbolID == %@ or symbolID == %@)",
            gridForAdaptiveIcon.symbolID(),
            gridForLegacyIcon.symbolID()
        );
        var gridLayers = page.children().filteredArrayUsingPredicate(predicate);
        gridLayers.forEach(function(grid) {
            var objectID = String(grid.objectID());
            gridStatus[objectID] = grid.isVisible();
            grid.setIsVisible(false);
        });

        // Export XML.
        var xmlFilePath = exportFolder + "/mipmap-anydpi-v26/ic_launcher.xml";
        var xmlFilePathRound = exportFolder + "/mipmap-anydpi-v26/ic_launcher_round.xml";
        var xmlContent = '' +
            '<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">\n' +
            '    <background android:drawable="@mipmap/ic_launcher_background"/>\n' +
            '    <foreground android:drawable="@mipmap/ic_launcher_foreground"/>\n' +
            '</adaptive-icon>';
        writeContentToFile(xmlFilePath, xmlContent);
        writeContentToFile(xmlFilePathRound, xmlContent);

        // Export png.
        exportIconAssets(
            context,
            exportFolder,
            [
                { scale: 1, suffix: "mdpi" },
                { scale: 1.5, suffix: "hdpi" },
                { scale: 2, suffix: "xhdpi" },
                { scale: 3, suffix: "xxhdpi" },
                { scale: 4, suffix: "xxxhdpi" }
            ],
            [
                {
                    layer: background,
                    name: "ic_launcher_background.png"
                },
                {
                    layer: foreground,
                    name: "ic_launcher_foreground.png"
                }
            ]
        );
        exportIconAssets(
            context,
            exportFolder,
            [
                { scale: 0.25, suffix: "mdpi" },
                { scale: 0.375, suffix: "hdpi" },
                { scale: 0.5, suffix: "xhdpi" },
                { scale: 0.75, suffix: "xxhdpi" },
                { scale: 1, suffix: "xxxhdpi" }
            ],
            [
                {
                    layer: iconNormal,
                    name: "ic_launcher.png"
                },
                {
                    layer: iconRound,
                    name: "ic_launcher_round.png"
                }
            ]
        );

        // Export Google Play icon.
        var googlePlayIcon = getLayerWithNameFromParent("google_play_icon", page);
        if (googlePlayIcon) {
            resizeArtboard(iconRound, 512);
            exportIconAssets(
                context,
                exportFolder,
                [
                    { scale: 1, suffix: "" }
                ],
                [
                    {
                        layer: googlePlayIcon,
                        name: "google_play_icon.png"
                    }
                ]
            );
        }

        // Restore grid layer status
        for (var layerID in gridStatus) {
            page.layerWithID(layerID).setIsVisible(gridStatus[layerID]);
        }

        toast(context, localizedString(context, "export_done"));

        // Open in Finder.
        if (getPreferences(context, "show_in_finder_after_export") == 1) {
            showInFinder(exportFolder);
        }
    }
}

function resizeArtboard(artboard, size) {
    artboard.frame().setWidth(size);
    artboard.frame().setHeight(size);
}

function exportIconAssets(context, exportFolder, exportConfig, outputConfig) {

    var doc = context.document;

    for (var i = 0; i < exportConfig.length; i++) {
        for (var j = 0; j < outputConfig.length; j++) {

            var ancestry = outputConfig[j]["layer"].ancestry();
            var exportRequest = MSExportRequest.exportRequestsFromLayerAncestry(ancestry).firstObject();
            exportRequest.setFormat("png");
            exportRequest.setScale(exportConfig[i]["scale"]);
            var outputPath = exportFolder + "/mipmap-" + exportConfig[i]["suffix"] + "/" + outputConfig[j]["name"];
            if (outputConfig[j]["name"] == "google_play_icon.png") {
                outputPath = exportFolder + "/google_play_icon.png";
            }
            doc.saveExportRequest_toFile(exportRequest, outputPath);

        }
    }
}

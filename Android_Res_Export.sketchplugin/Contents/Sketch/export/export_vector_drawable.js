var ga = require("../lib/google_analytics");
var message = require("../lib/message");
var localizedString = require("../lib/localizedString");
var io = require("../lib/io");
var preferences = require("../lib/preferences");
var common = require("../lib/common");
var svg2vector = require("../lib/main");

var toast = message.toast;
var chooseFolder = io.chooseFolder;
var directoryIsWriteable = io.directoryIsWriteable;
var getPreferences = preferences.getPreferences;
var VECTORDRAWABLE_FOLDERS = common.VECTORDRAWABLE_FOLDERS;
var assetName = common.assetName;
var showInFinder = io.showInFinder;

var onRun = function(context) {

    ga(context, "Export", "export_vector_drawable");

    var selection = context.selection;

    var exportVectorAssets;
    if (selection.count() > 0) {
        exportVectorAssets = getVectorAssetFromSelection(context);
    } else {
        exportVectorAssets = getVectorAssetFromDocument(context);
    }

    if (exportVectorAssets.count() == 0) {
        toast(context, localizedString(context, "no_vector_drawable_asset"));
        return;
    }

    var exportFolder = chooseFolder();
    if (exportFolder) {

        // ExportFolder is writeable
        if (!directoryIsWriteable(exportFolder)) {
            toast(context, localizedString(context, "cannot_export_to_folder"));
            return;
        }

        // Vector assets folder
        var assetNameType = getPreferences(context, "asset_name_type");
        var vectorAssetFolderIndex = getPreferences(context, "vector_drawable_folder");
        var vectorAssetFolder;
        if (vectorAssetFolderIndex) {
            vectorAssetFolder = VECTORDRAWABLE_FOLDERS[vectorAssetFolderIndex];
        } else {
            vectorAssetFolder = VECTORDRAWABLE_FOLDERS[0];
        }

        var floatPrecision = getPreferences(context, "vector_drawable_precision") || 2;

        var loopExportVectors = exportVectorAssets.objectEnumerator();
        var slice;
        while (slice = loopExportVectors.nextObject()) {

            var vectorAssetGroup = slice.parentGroup();
            var fillSweepGradients = [];
            var strokeSweepGradients = [];
            var loopAssetChildren = vectorAssetGroup.children().objectEnumerator();
            var layer;
            while (layer = loopAssetChildren.nextObject()) {
                if (styleLayer(layer)) {
 
                    var style = layer.style();

                    style.enabledFills().forEach(function(fill) {
                        if (fill.fillType() == 1) {
                            if (fill.gradient().gradientType() == 2) {
                                var sweepGradient = {
                                    tagId: "sweep-" + fill.objectID(),
                                    stops: []
                                };
                                fill.gradient().stops().forEach(function(stop) {
                                    sweepGradient.stops.push({
                                        color: colorToAndroid(stop.color()),
                                        offset: stop.position()
                                    });
                                });
                                fillSweepGradients.push(sweepGradient);
                            }
                        }
                    });

                    style.enabledBorders().forEach(function(border) {
                        if (border.fillType() == 1) {
                            if (border.gradient().gradientType() == 2) {
                                var sweepGradient = {
                                    tagId: "sweep-" + border.objectID(),
                                    stops: []
                                };
                                border.gradient().stops().forEach(function(stop) {
                                    sweepGradient.stops.push({
                                        color: colorToAndroid(stop.color()),
                                        offset: stop.position()
                                    });
                                });
                                strokeSweepGradients.push(sweepGradient);
                            }
                        }
                    });

                }
            }

            // SVG code
            var exportRequest = MSExportRequest.exportRequestsFromExportableLayer(slice).firstObject();
            var exporter = MSExporter.exporterForRequest_colorSpace(exportRequest, NSColorSpace.sRGBColorSpace());
            var svgData = exporter.data();
            var svgCode = NSString.alloc().initWithData_encoding(svgData, NSUTF8StringEncoding);

            // Sweep gradient hacking, svg is not support angle gradient.
            fillSweepGradients.forEach(function(gradient, index) {
                var match = /fill=""/.exec(svgCode);
                if (match) {
                    svgCode = svgCode.replace(match[0], 'fill="url(#' + fillSweepGradients[fillSweepGradients.length - index - 1]["tagId"] + ')"');
                }
                svgCode = insertCodeToSVG(sweepGradientCode(gradient), svgCode);
            });
            strokeSweepGradients.forEach(function(gradient) {
                var match = /stroke=""/.exec(svgCode);
                if (match) {
                    svgCode = svgCode.replace(match[0], 'stroke="url(#' + strokeSweepGradients[strokeSweepGradients.length - index - 1]["tagId"] + ')"');
                }
                svgCode = insertCodeToSVG(sweepGradientCode(gradient), svgCode);
            });

            // Export
            var outputPath = exportFolder + "/" + vectorAssetFolder + "/" + assetName(slice, assetNameType) + ".xml";
            // svg2vector(s2v, svgCode, outputPath, floatPrecision, function(message) {
            //     toast(context, message);
            // });

            // log(svgCode);

            // log(svg2vectordrawable)

            svg2vector(svgCode, 2, undefined, undefined, function(xml) {
                console.log(xml);
            });
            
            // .then(function(xmlCode) {
            //     log(xmlCode);
            // });

        }




        // toast(context, localizedString(context, "export_done"));

        // if (getPreferences(context, "show_in_finder_after_export") == 1) {
        //     showInFinder(exportFolder + "/" + vectorAssetFolder);
        // }

    }
}

function getVectorAssetFromSelection(context) {
    var assets = NSMutableArray.alloc().init();
    var predicate = NSPredicate.predicateWithFormat(
        'className == "MSSliceLayer" && name != "#9patch" && exportOptions.firstFormat == "svg"'
    );
    var selection = context.selection;
    selection.forEach(function(layer) {
        assets.addObjectsFromArray(layer.children().filteredArrayUsingPredicate(predicate));
    });
    return assets;
}

function getVectorAssetFromDocument(context) {
    var predicate = NSPredicate.predicateWithFormat(
        'className == "MSSliceLayer" && name != "#9patch" && exportOptions.firstFormat == "svg"'
    );
    return context.document.allExportableLayers().filteredArrayUsingPredicate(predicate);
}

function insertCodeToSVG(code, svg) {
    return svg.replace("</svg>", String(code) + "</svg>");;
}

function sweepGradientCode(gradient) {
    var xml = '<sweepGradient id="' + gradient.tagId + '">';
    gradient.stops.forEach(function(stop) {
        xml += '<stop stop-color="' + stop.color + '" offset="' + stop.offset + '"></stop>';
    });
    xml += '</sweepGradient>';
    return xml;
}

function svg2vector(s2v, svgCode, vectorFile, floatPrecision, showErrorMessage) {
    runCommand("/bin/bash", ["-l", "-c", s2v + " -p " + floatPrecision + " -s '" + svgCode + "' -o '" + vectorFile + "'"], function(status, msg) {
        if (!status && msg != "") {
            showErrorMessage(msg);
        }
    });
}

function styleLayer(layer) {
    if (MSApplicationMetadata.metadata().appVersion >= 52) {
        if (
            layer.class() == "MSShapeGroup" ||
            layer.class() == "MSRectangleShape" ||
            layer.class() == "MSOvalShape" ||
            layer.class() == "MSShapePathLayer" ||
            layer.class() == "MSStarShape" ||
            layer.class() == "MSPolygonShape"
        ) {
            return true;
        }
    } else {
        if (layer.class() == "MSShapeGroup") {
            return true;
        }
    }
    return false;
}

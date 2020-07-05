var ga = require("../lib/google_analytics");
var message = require("../lib/message");
var localizedString = require("../lib/localizedString");
var preferences = require("../lib/preferences");
var io = require("../lib/io");
var common = require("../lib/common");
var layer = require("../lib/layer");

var toast = message.toast;
var chooseFolder = io.chooseFolder;
var showInFinder = io.showInFinder;
var mkdir = io.mkdir;
var directoryIsWriteable = io.directoryIsWriteable;
var getPreferences = preferences.getPreferences;
var dpiToScale = common.dpiToScale;
var assetName = common.assetName;
var getLayerWithNameFromParent = layer.getLayerWithNameFromParent;

var onRun = function(context) {

    ga(context, "Export", "export_nine_patch");

    var doc = context.document;
    var selection = context.selection;

    var exportNinePatches;
    if (selection.count() > 0) {
        exportNinePatches = getNinePatchAssetFromSelection(context);
    } else {
        exportNinePatches = getNinePatchAssetFromDocument(context);
    }

    if (exportNinePatches.count() == 0) {
        toast(context, localizedString(context, "no_nine_patch_asset"));
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

        var loopExportNinePatches = exportNinePatches.objectEnumerator();
        var ninePatch;
        while (ninePatch = loopExportNinePatches.nextObject()) {

            var ninePatchGroup = ninePatch.group;
            var ninePatchContent = ninePatch.content;
            var ninePatchPatch = ninePatch.patch;
            var ninePatchName = assetName(ninePatchGroup, assetNameType);

            // Patch lines round to pixel
            var loopNinePatchLines = ninePatchPatch.children().objectEnumerator();
            var line;
            while (line = loopNinePatchLines.nextObject()) {
                if (line.class() == "MSShapeGroup" || line.class() == "MSRectangleShape") {
                    line.absoluteRect().setX(Math.round(line.absoluteRect().x()));
                    line.absoluteRect().setY(Math.round(line.absoluteRect().y()));
                    var width = Math.round(line.absoluteRect().width()) < 1 ? 1 : Math.round(line.absoluteRect().width());
                    var height = Math.round(line.absoluteRect().height()) < 1 ? 1 : Math.round(line.absoluteRect().height());
                    line.absoluteRect().setWidth(width);
                    line.absoluteRect().setHeight(height);
                }
            }

            // Save nine-patch patch NSImage at mdpi
            var nsImageOfPatchTop = imageOfLayer_rect_scale(
                doc,
                ninePatchPatch,
                CGRectMake(ninePatchPatch.absoluteRect().x() + 1, ninePatchPatch.absoluteRect().y(), ninePatchPatch.absoluteRect().width() - 2, 1),
                1
            );
            var nsImageOfPatchRight = imageOfLayer_rect_scale(
                doc,
                ninePatchPatch,
                CGRectMake(ninePatchPatch.absoluteRect().x() + ninePatchPatch.absoluteRect().width() - 1, ninePatchPatch.absoluteRect().y() + 1, 1, ninePatchPatch.absoluteRect().height() - 2),
                1
            );
            var nsImageOfPatchBottom = imageOfLayer_rect_scale(
                doc,
                ninePatchPatch,
                CGRectMake(ninePatchPatch.absoluteRect().x() + 1, ninePatchPatch.absoluteRect().y() + ninePatchPatch.absoluteRect().height() - 1, ninePatchPatch.absoluteRect().width() - 2, 1),
                1
            );
            var nsImageOfPatchLeft = imageOfLayer_rect_scale(
                doc,
                ninePatchPatch,
                CGRectMake(ninePatchPatch.absoluteRect().x(), ninePatchPatch.absoluteRect().y() + 1, 1, ninePatchPatch.absoluteRect().height() - 2),
                1
            );

            exportDpis.forEach(function(dpi) {

                var scale = dpiToScale(dpi);
                if (scale == 1) {

                    // Mkdir
                    var outputFolder = exportFolder + "/drawable-mdpi";
                    var outputPath = outputFolder + "/" + ninePatchName + ".9.png";
                    mkdir(outputFolder);

                    var exportRequestOfPatchGroup = exportRequestOfLayer_inRect_scale(ninePatchGroup, ninePatchGroup.absoluteRect().rect(), 1);
                    doc.saveExportRequest_toFile(exportRequestOfPatchGroup, outputPath);

                }
                else {

                    var nsImageOfPatchContent = imageOfLayer_rect_scale(doc, ninePatchContent, ninePatchContent.absoluteRect().rect(), scale);
                    var bitmapRepOfPatchContent = bitmapRepFromNSImage_scale(nsImageOfPatchContent, 1);
                    var bitmapRepOfPatchTop = bitmapRepFromNSImage_scale(nsImageOfPatchTop, scale);
                    var bitmapRepOfPatchRight = bitmapRepFromNSImage_scale(nsImageOfPatchRight, scale);
                    var bitmapRepOfPatchBottom= bitmapRepFromNSImage_scale(nsImageOfPatchBottom, scale);
                    var bitmapRepOfPatchLeft = bitmapRepFromNSImage_scale(nsImageOfPatchLeft, scale);
                    
                    var contentImageSize = nsImageOfPatchContent.size();
                    var scaleFactor = NSScreen.mainScreen().backingScaleFactor();
                    var resultImageSize = NSMakeSize(Math.round((contentImageSize.width + 2)), Math.round((contentImageSize.height + 2)));
                    var resultImage = NSImage.alloc().initWithSize(resultImageSize);
                    resultImage.lockFocus();
                    NSGraphicsContext.currentContext().setImageInterpolation(NSImageInterpolationNone);
                    var transform = NSAffineTransform.transform();
                    transform.scaleXBy_yBy(1 / scaleFactor, 1 / scaleFactor);
                    transform.concat();
                    nsImageOfPatchContent.drawRepresentation_inRect(bitmapRepOfPatchContent, NSMakeRect(1, 1, contentImageSize.width, contentImageSize.height));
                    nsImageOfPatchTop.drawRepresentation_inRect(bitmapRepOfPatchTop, NSMakeRect(1, resultImageSize.height - 1, contentImageSize.width, 1));
                    nsImageOfPatchRight.drawRepresentation_inRect(bitmapRepOfPatchRight, NSMakeRect(resultImageSize.width - 1, 1, 1, contentImageSize.height));
                    nsImageOfPatchBottom.drawRepresentation_inRect(bitmapRepOfPatchBottom, NSMakeRect(1, 1 - bitmapRepOfPatchBottom.pixelsHigh(), contentImageSize.width, 1));
                    nsImageOfPatchLeft.drawRepresentation_inRect(bitmapRepOfPatchLeft, NSMakeRect(1 - bitmapRepOfPatchLeft.pixelsWide(), 1, 1, contentImageSize.height));
                    var resultImageBitmapRep = NSBitmapImageRep.alloc().initWithFocusedViewRect(NSMakeRect(0, 0, resultImageSize.width, resultImageSize.height));
                    resultImage.unlockFocus();

                    // Mkdir
                    var outputFolder = exportFolder + "/drawable-" + dpi;
                    var outputPath = outputFolder + "/" + ninePatchName + ".9.png";
                    mkdir(outputFolder);

                    saveBitmapRep(resultImageBitmapRep, outputPath);

                }

            });
        }

        toast(context, localizedString(context, "export_done"));

        if (getPreferences(context, "show_in_finder_after_export") == 1) {
            showInFinder(exportFolder);
        }
    }
};

function exportRequestOfLayer_inRect_scale(layer, rect, scale) {
    var exportRequest = MSExportRequest.exportRequestsFromLayerAncestry_inRect(layer.ancestry(), rect).firstObject();
    exportRequest.setFormat("png");
    exportRequest.setScale(scale);
    return exportRequest;
}

function imageOfLayer_rect_scale(doc, layer, rect, scale) {
    var exportRequest = exportRequestOfLayer_inRect_scale(layer, rect, scale);
    var exporter = MSExporter.exporterForRequest_colorSpace(exportRequest, doc.colorSpace());
    var image = exporter.image();
    var imageSize = NSMakeSize(Math.round(rect.size.width * scale), Math.round(rect.size.height * scale));
    image.setSize(imageSize);
    return image;
}

function bitmapRepFromNSImage_scale(nsImage, scale) {
    var scaledSize = NSMakeSize(Math.round(nsImage.size().width * scale), Math.round(nsImage.size().height * scale));
    var imageData = nsImage.TIFFRepresentation();
    var imageRep = NSBitmapImageRep.imageRepWithData(imageData);
    imageRep.setSize(scaledSize);
    imageRep.setPixelsWide(scaledSize.width);
    imageRep.setPixelsHigh(scaledSize.height);

    var scaleFactor = NSScreen.mainScreen().backingScaleFactor();
    var imageScale = NSImage.alloc().initWithSize(
        NSMakeSize(Math.round(nsImage.size().width * scale / scaleFactor), Math.round(nsImage.size().height * scale / scaleFactor))
    );
    imageScale.lockFocus();
    NSGraphicsContext.currentContext().setImageInterpolation(NSImageInterpolationNone);
    var transform = NSAffineTransform.transform();
    transform.scaleXBy_yBy(1 / scaleFactor, 1 / scaleFactor);
    transform.concat();
    nsImage.drawRepresentation_inRect(imageRep, NSMakeRect(0, 0, imageScale.size().width, imageScale.size().height));
    var bitmapRep = NSBitmapImageRep.alloc().initWithFocusedViewRect(NSMakeRect(0, 0, scaledSize.width, scaledSize.height));
    imageScale.unlockFocus();

    return bitmapRep;
}

function saveBitmapRep(bitmapRep, path) {
    var imageData = bitmapRep.representationUsingType_properties(NSPNGFileType, nil);
    imageData.writeToFile_atomically(path, "NO");
}

function getNinePatchAssetFromDocument(context) {
    var assets = NSMutableArray.alloc().init();
    var predicate = NSPredicate.predicateWithFormat(
        'className == "MSSliceLayer" && name == "#9patch" && exportOptions.firstFormat == "png"'
    );
    var ninePathSlices = context.document.allExportableLayers().filteredArrayUsingPredicate(predicate);
    var loopSlices = ninePathSlices.objectEnumerator();
    var slice;
    while (slice = loopSlices.nextObject()) {
        if (isNinePatchLayerGroup(slice)) {
            assets.addObject({
                "group": slice.parentGroup().parentGroup(),
                "patch": getLayerWithNameFromParent("patch", slice.parentGroup().parentGroup()),
                "content": slice.parentGroup()
            });
        }
    }
    return assets;
}

function getNinePatchAssetFromSelection(context) {
    var assets = NSMutableArray.alloc().init();
    var predicate = NSPredicate.predicateWithFormat(
        'className == "MSSliceLayer" && name == "#9patch" && exportOptions.firstFormat == "png"',
    );
    var selection = context.selection;
    selection.forEach(function(layer) {
        var ninePathSlices = layer.children().filteredArrayUsingPredicate(predicate);
        var loopSlices = ninePathSlices.objectEnumerator();
        var slice;
        while (slice = loopSlices.nextObject()) {
            if (isNinePatchLayerGroup(slice)) {
                assets.addObject({
                    "group": layer,
                    "patch": getLayerWithNameFromParent("patch", slice.parentGroup().parentGroup()),
                    "content": slice.parentGroup()
                });
            }
        }
    });
    return assets;
}

function isNinePatchLayerGroup(sliceLayer) {
    var result = false;
    if(sliceLayer.parentGroup().parentGroup().class() != "MSPage") {
        var root = sliceLayer.parentGroup().parentGroup();
        if(
            (root.layers().indexOfObject(getLayerWithNameFromParent("patch", root)) < root.layers().count()) &&
            sliceLayer.parentGroup().name() == "content"
        ) {
            result = true;
        }
    }
    return result;
}

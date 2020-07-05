var ga = require("../lib/google_analytics");
var message = require("../lib/message");
var localizedString = require("../lib/localizedString");
var preferences = require("../lib/preferences");
var common = require("../lib/common");
var layer = require("../lib/layer");

var toast = message.toast;
var getPreferences = preferences.getPreferences;
var assetName = common.assetName;
var getLayerWithNameFromParent = layer.getLayerWithNameFromParent;
var groupFromLayers = layer.groupFromLayers;
var addSliceInToGroup = layer.addSliceInToGroup;
var addRectShape = layer.addRectShape;

var onRun = function(context) {

    ga(context, "New", "new_nine_patch");

    var doc = context.document;
    var selection = context.selection;
    var selectionCount = selection.count();

    if (selectionCount == 0) {
        toast(context, localizedString(context, "no_selection"));
        return;
    }

    var predicate = NSPredicate.predicateWithFormat('className == "MSArtboardGroup" || className == "MSSymbolMaster"');
    if (selection.filteredArrayUsingPredicate(predicate).count() > 0) {
        toast(context, localizedString(context, "can_not_create_nine_patch_from_artboard_or_symbol_master"));
        return;
    }

    var assetNameType = getPreferences(context, "asset_name_type");

    var groupNinePatches = [];
    var loopSelection = selection.objectEnumerator();
    var layer;
    while (layer = loopSelection.nextObject()) {

        var groupNinePatch;
        var groupContent;
        var groupPatch;
        var name = assetName(layer, assetNameType);

        if (layer.class() == "MSLayerGroup") {
            // No content and patch group
            if (getLayerWithNameFromParent("content", layer)) {
                groupNinePatch = layer;
                groupContent = getLayerWithNameFromParent("content", layer);
            } else {
                groupContent = layer;
                groupContent.setName("content");
                // Group nine patch
                groupNinePatch = groupFromLayers([groupContent]);
                groupNinePatch.setName(name);
            }
        } else {
            groupContent = groupFromLayers([layer]);
            groupContent.setName("content");
            // Group nine patch
            groupNinePatch = groupFromLayers([groupContent]);
            groupNinePatch.setName(name);
        }

        var slice = addSliceInToGroup(groupContent, "#9patch", "png");
        slice.select_byExtendingSelection(false, true);

        if (getLayerWithNameFromParent("patch", groupNinePatch)) {
            slice.absoluteRect().setRect(
                CGRectMake(
                    groupNinePatch.absoluteRect().x() + 1,
                    groupNinePatch.absoluteRect().y() + 1,
                    groupNinePatch.absoluteRect().width() - 2,
                    groupNinePatch.absoluteRect().height() - 2
                )
            );
        } else {
            // Add patch lines
            var width = groupContent.frame().width();
            var height = groupContent.frame().height();
            var color = "#000000";
            var patchLeft = addRectShape(groupNinePatch, null, -1, 0, 1, height, color, "left");
            var patchBottom = addRectShape(groupNinePatch, null, 0, height, width, 1, color, "bottom");
            var patchRight = addRectShape(groupNinePatch, null, width, 0, 1, height, color, "right");
            var patchTop = addRectShape(groupNinePatch, null, 0, -1, width, 1, color, "top");
            // Group patch line
            var groupPatch = groupFromLayers([patchBottom, patchRight, patchTop, patchLeft]);
            groupPatch.setName("patch");
        }

        if (MSApplicationMetadata.metadata().appVersion >= 53) {
            groupNinePatch.fixGeometryWithOptions(1);
        } else {
            groupNinePatch.resizeToFitChildrenWithOption(1);
        }
        groupNinePatch.setLayerListExpandedType(2);

        groupNinePatches.push(groupNinePatch);

    }

    doc.currentPage().changeSelectionBySelectingLayers(groupNinePatches);
}

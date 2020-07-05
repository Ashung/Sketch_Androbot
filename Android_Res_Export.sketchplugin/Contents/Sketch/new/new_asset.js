var ga = require("../lib/google_analytics");
var common = require("../lib/common");
var preferences = require("../lib/preferences");
var localizedString = require("../lib/localizedString");
var message = require("../lib/message");
var layer = require("../lib/layer");

var getPreferences = preferences.getPreferences;
var toast = message.toast;
var assetName = common.assetName;
var groupFromLayers = layer.groupFromLayers;
var addSliceInToGroup = layer.addSliceInToGroup;

var newBitmapAsset = function(context) {
    ga(context, "New", "new_bitmap_asset");
    newAsset(context, "png");
};

var newVectorAsset = function(context) {
    ga(context, "New", "new_vector_asset");
    newAsset(context, "svg");
};

function newAsset(context, format) {

    var selection = context.selection;
    var selectionCount = selection.count();

    if (selectionCount == 0) {
        toast(context, localizedString(context, "no_selection"));
        return;
    }

    var assetNameType = getPreferences(context, "asset_name_type");

    var loopSelection = selection.objectEnumerator();
    var layer;
    while (layer = loopSelection.nextObject()) {
        var name = assetName(layer, assetNameType);
        var layerGroup;
        if (
            layer.class() == "MSLayerGroup" ||
            layer.class() == "MSArtboardGroup" ||
            layer.class() == "MSSymbolMaster"
        ) {
            layerGroup = layer;
        } else if (layer.class() == "MSSliceLayer") {
            if (
                layer.parentGroup().class() == "MSLayerGroup" ||
                layer.parentGroup().class() == "MSArtboardGroup" ||
                layer.parentGroup().class() == "MSSymbolMaster"
            ) {
                layerGroup = layer.parentGroup();
            }
        } else if (layer.class() == "MSHotspotLayer") {
            layerGroup = undefined;
        } else {
            layerGroup = groupFromLayers([layer]);
            layerGroup.setName(name);
        }
        if (layerGroup) {
            addSliceInToGroup(layerGroup, name, format);
            layerGroup.setLayerListExpandedType(2);
        }
    }
};

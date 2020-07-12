var ga = require("../lib/google_analytics");
var message = require("../lib/message");
var localizedString = require("../lib/localizedString");
var preferences = require("../lib/preferences");
var common = require("../lib/common");
var window = require("../lib/window");
var io = require("../lib/io");

var toast = message.toast;
var getPreferences = preferences.getPreferences;
var assetName = common.assetName;
var colorToAndroid = common.colorToAndroid;
var showCodeWindow = window.showCodeWindow;
var chooseFolder = io.chooseFolder;
var directoryIsWriteable = io.directoryIsWriteable;
var mkdir = io.mkdir;
var writeContentToFile = io.writeContentToFile;
var showInFinder = io.showInFinder;

var onRun = function(context) {

    ga(context, "Preview", "view_color_code");

    var selection = context.selection;
    if (selection.count() == 0) {
        toast(context, localizedString(context, "no_selected_shape_layer"));
        return;
    }

    var colorsArray = NSMutableArray.alloc().init();
    var baseColorNamesAndCount = NSMutableDictionary.alloc().init();

    var assetNameType = getPreferences(context, "asset_name_type");
    if (assetNameType == 2) {
        assetNameType = 0;
    } else if (assetNameType == 3) {
        assetNameType = 1;
    }

    var loopSelection = selection.objectEnumerator();
    var layer;
    while (layer = loopSelection.nextObject()) {

        // Name
        var layerName = assetName(layer, assetNameType);

        if (baseColorNamesAndCount.objectForKey(layerName)) {
            var count = baseColorNamesAndCount.objectForKey(layerName) + 1;
            baseColorNamesAndCount.setObject_forKey(count, layerName);
        } else {
            baseColorNamesAndCount.setObject_forKey(1, layerName);
        }
        if (baseColorNamesAndCount.objectForKey(layerName) > 1) {
            layerName += "_" + baseColorNamesAndCount.objectForKey(layerName);
        }

        // Color
        if (
            layer.class() == "MSShapeGroup" ||
            layer.class() == "MSRectangleShape" ||
            layer.class() == "MSOvalShape" ||
            layer.class() == "MSShapePathLayer"
        ) {
            if (layer.style().enabledFills().count() > 0) {
                var fillType = layer.style().enabledFills().lastObject().fillType();
                if (fillType == 0) {
                    var lastColor = layer.style().enabledFills().lastObject().color();
                    var color = colorToAndroid(lastColor);
                    var name = layerName;
                    var colorsDictionary = NSMutableDictionary.alloc().init();
                    colorsDictionary.setObject_forKey(name, "name");
                    colorsDictionary.setObject_forKey(color, "color");
                    if (!colorsArray.containsObject(colorsDictionary)) {
                        colorsArray.addObject(colorsDictionary);
                    }
                }
                if (fillType == 1) {
                    var stops = layer.style().enabledFills().lastObject().gradient().stops();
                    var loopStops = stops.objectEnumerator();
                    var stopIndex = 1;
                    var stop;
                    while (stop = loopStops.nextObject()) {
                        var color = colorToAndroid(stop.color());
                        var name = layerName + "_gradient_stop_" + stopIndex;
                        stopIndex ++;
                        var colorsDictionary = NSMutableDictionary.alloc().init();
                        colorsDictionary.setObject_forKey(name, "name");
                        colorsDictionary.setObject_forKey(color, "color");
                        if (!colorsArray.containsObject(colorsDictionary)) {
                            colorsArray.addObject(colorsDictionary);
                        }
                    }
                }
            }
        }

    }

    if (colorsArray.count() == 0) {
        toast(context, localizedString(context, "no_color_in_selected_layers"));
        return;
    }

    var sortDescriptor = NSSortDescriptor.sortDescriptorWithKey_ascending_selector(
        "name", true, "localizedStandardCompare:"
    );
    colorsArray = colorsArray.sortedArrayUsingDescriptors([sortDescriptor]);

    var xml = '<resources>\n';

    colorsArray.forEach(function(color) {
        var key = color.objectForKey("name");
        var color = color.objectForKey("color");
        xml += '    <color name="' + key + '">' + color + '</color>\n';
    });

    xml += "</resources>\n";

    showCodeWindow(context, xml, function(xml) {
        var exportFolder = chooseFolder();
        if (exportFolder) {

            if (!directoryIsWriteable(exportFolder)) {
                toast(context, localizedString(context, "cannot_export_to_folder"));
                return;
            }

            mkdir(exportFolder + "/values/");

            writeContentToFile(exportFolder + "/values/colors.xml", xml);

            if (getPreferences(context, "show_in_finder_after_export") == 1) {
                showInFinder(exportFolder + "/values");
            }

        }
    });

};

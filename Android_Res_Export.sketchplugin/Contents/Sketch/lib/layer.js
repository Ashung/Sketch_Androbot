function groupFromSelection(context) {
    var selection = context.selection;
    var group = groupFromLayers(selection);
    return group;
}

function groupFromLayers(layers) {
    var group;
    var layerArray = MSLayerArray.arrayWithLayers(layers);
    if (MSApplicationMetadata.metadata().appVersion >= 52) {
        group = MSLayerGroup.groupWithLayers(layerArray);
    } else {
        group = MSLayerGroup.groupFromLayers(layerArray);
    }
    return group;
}

function addSliceInToGroup(layerGroup, name, format) {

    removeSliceInGroup(layerGroup);

    var slice = MSSliceLayer.sliceLayerFromLayer(layerGroup);
    slice.frame().setX(Math.floor(layerGroup.frame().x()));
    slice.frame().setY(Math.floor(layerGroup.frame().y()));
    slice.frame().setWidth(Math.ceil(layerGroup.frame().width()));
    slice.frame().setHeight(Math.ceil(layerGroup.frame().height()));
    slice.setName(name);
    slice.exportOptions().setLayerOptions(2);
    slice.exportOptions().removeAllExportFormats();
    var exportOption = slice.exportOptions().addExportFormat();
    exportOption.setFileFormat(format);
    exportOption.setName("");
    exportOption.setScale(1);

    if (
        !Number.isInteger(layerGroup.absoluteRect().x()) ||
        !Number.isInteger(layerGroup.absoluteRect().y()) ||
        !Number.isInteger(layerGroup.absoluteRect().width()) ||
        !Number.isInteger(layerGroup.absoluteRect().height())
    ) {
        var newGroup = groupFromLayers([layerGroup, slice]);
        newGroup.setName(layerGroup.name());
        slice.moveToLayer_beforeLayer(newGroup, newGroup.firstLayer());
        layerGroup.ungroup();
        newGroup.fixGeometryWithOptions(1);
    } else {
        slice.moveToLayer_beforeLayer(layerGroup, layerGroup.firstLayer());
    }

    return slice;
}

function removeSliceInGroup(layerGroup) {
    var loop = layerGroup.children().objectEnumerator();
    var layer;
    while (layer = loop.nextObject()) {
        if (layer.class() == "MSSliceLayer") {
            layer.removeFromParent();
        }
    }
}

function addRectShape(parent, beforeLayer, posX, posY, width, height, color, name) {
    var rectangle = MSRectangleShape.alloc().init();
    rectangle.setRect(CGRectMake(posX, posY, width, height));
    var shapeGroup;
    if (MSApplicationMetadata.metadata().appVersion >= 52) {
        shapeGroup = rectangle;
    } else {
        shapeGroup = MSShapeGroup.shapeWithPath(rectangle);
    }
    shapeGroup.setName(name);

    if (color) {
        // color #rrggbb
        var colorObject = MSColor.colorWithRed_green_blue_alpha(
            parseInt(color.substr(1, 2), 16) / 255,
            parseInt(color.substr(3, 2), 16) / 255,
            parseInt(color.substr(4, 2), 16) / 255,
            1.0
        );
        shapeGroup.style().addStylePartOfType(0);
        shapeGroup.style().fills().firstObject().setColor(colorObject);
    }

    if (beforeLayer) {
        parent.insertLayer_beforeLayer(shapeGroup, beforeLayer);
    } else {
        parent.addLayer(shapeGroup);
    }

    return shapeGroup;
}

function getLayerWithNameFromParent(name, parent) {
    var predicate = NSPredicate.predicateWithFormat("name == %@", name);
    var layers = parent.layers().filteredArrayUsingPredicate(predicate);
    return layers.firstObject();
}

module.exports.groupFromSelection = groupFromSelection;
module.exports.groupFromLayers = groupFromLayers;
module.exports.addSliceInToGroup = addSliceInToGroup;
module.exports.removeSliceInGroup = removeSliceInGroup;
module.exports.addRectShape = addRectShape;
module.exports.getLayerWithNameFromParent = getLayerWithNameFromParent;
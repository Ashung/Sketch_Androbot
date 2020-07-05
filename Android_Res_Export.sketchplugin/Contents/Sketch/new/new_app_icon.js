var ga = require("../lib/google_analytics");
var message = require("../lib/message");
var localizedString = require("../lib/localizedString");

var toast = message.toast;

var onRun = function(context) {

    ga(context, "New", "new_app_icon");

    importFromResource_toPage_withMetadata(
        context,
        "app_icon_template.sketch",
        "App Icon",
        {"is_android_app_icon_template": true}
    );

}

function importFromResource_toPage_withMetadata(context, resource, pageName, metadata) {

    var doc = context.document;
    var documentData = doc.documentData();

    // Template file.
    var template = context.plugin.urlForResourceNamed(resource);

    if (!template) {
        // Template file path.
        var templatePath = context.plugin.url().path().lastPathComponent() + "/Contents/Resources/" + resource;
        toast(context, localizedString(context, 'template_no_exists', templatePath));
        return;
    }

    // Create new page.
    var pageForIcon = MSPage.alloc().init();
    pageForIcon.setName(pageName);
    documentData.insertPage_atIndex(pageForIcon, 0);
    documentData.setCurrentPage(pageForIcon);
    if (MSApplicationMetadata.metadata().appVersion < 54) {
        doc.pageTreeLayoutDidChange();
    }

    // Read data from Sketch file.
    var templateDocument = MSDocument.alloc().init();
    templateDocument.readFromURL_ofType_error(template, "com.bohemiancoding.sketch.drawing", nil);

    if (templateDocument.currentPage().layers().count() == 0) {
        return;
    }

    // Old symbolID to new symbolID mapping.
    var symbolIDMapping = NSMutableDictionary.alloc().init();
    var allSymbols = templateDocument.documentData().allSymbols();
    var loopAllSymbols = allSymbols.objectEnumerator();
    var symbol;
    while (symbol = loopAllSymbols.nextObject()) {
        symbolIDMapping.setObject_forKey(
            NSUUID.UUID().UUIDString(),
            symbol.symbolID()
        );
    }

    // Change all objectID and symbolID
    var templatePage = templateDocument.pages().firstObject();
    var loopChildren = templatePage.children().objectEnumerator();
    var child;
    while (child = loopChildren.nextObject()) {
        child.generateObjectID();
        child.setLayerListExpandedType(1);
        if (child.class() == "MSSymbolMaster" || child.class() == "MSSymbolInstance") {
            var newSymbolID = symbolIDMapping.objectForKey(child.symbolID());
            child.setSymbolID(newSymbolID);
        }
    }

    // Add layers.
    pageForIcon.addLayers(templatePage.layers());

    // Add metadata to page.
    for (var key in metadata) {
        pageForIcon.storeMetadata_forKey(metadata[key], key);
    }

    // Center layers in canvas.
    if (doc.contentDrawView) {
        doc.contentDrawView().centerLayersInCanvas();
    } else {
        doc.currentView().centerLayersInCanvas();
    }

}

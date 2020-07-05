var ga = require("../lib/google_analytics");
var preferences = require("../lib/preferences");
var localizedString = require("../lib/localizedString");
var common = require("../lib/common");
var io = require("../lib/io");

var getPreferences = preferences.getPreferences;
var setPreferences = preferences.setPreferences;
var removeSystemPreference = preferences.removeSystemPreference;
var getSystemPreference = preferences.getSystemPreference;
var setSystemPreference = preferences.setSystemPreference;
var fileExists = io.fileExists;

var onRun = function(context) {

    ga(context, "Setting", "preferences");

    // Dialog
    var dialog = COSAlertWindow.alloc().init();
    dialog.setMessageText(localizedString(context, "preferences"));

    // Icon
    var iconPath = context.plugin.urlForResourceNamed("icon.png").path();
    var iconNSImage = NSImage.alloc().initWithContentsOfFile(iconPath);
    dialog.setIcon(iconNSImage);

    // Export dpis
    dialog.addAccessoryView(groupLabel(localizedString(context, "export_dpis")));
    var exportDpisView = NSView.alloc().initWithFrame(NSMakeRect(0, 0, 300, 40));
    exportDpisView.setFlipped(true);
    var exportDpis;
    if (!getPreferences(context, "export_dpis")) {
        exportDpis = NSMutableSet.alloc().init();
        Object.keys(DPIS).forEach(function(dpi) {
            exportDpis.addObject(dpi);
        });
        setPreferences(context, "export_dpis", exportDpis.allObjects());
    } else {
        exportDpis = NSMutableSet.alloc().initWithArray(getPreferences(context, "export_dpis"));
    }
    var exportMDPI = checkBox(
        exportDpis.containsObject("mdpi") ? true : false,
        "MDPI",
        NSMakeRect(0, 0, 100, 16)
    );
    var exportHDPI = checkBox(
        exportDpis.containsObject("hdpi") ? true : false,
        "HDPI",
        NSMakeRect(100, 0, 100, 16)
    );
    var exportXHDPI = checkBox(
        exportDpis.containsObject("xhdpi") ? true : false,
        "XHDPI",
        NSMakeRect(200, 0, 100, 16)
    );
    var exportXXHDPI = checkBox(
        exportDpis.containsObject("xxhdpi") ? true : false,
        "XXHDPI",
        NSMakeRect(0, 24, 100, 16)
    );
    var exportXXXHDPI = checkBox(
        exportDpis.containsObject("xxxhdpi") ? true : false,
        "XXXHDPI",
        NSMakeRect(100, 24, 100, 16)
    );
    exportDpisView.addSubview(exportMDPI);
    exportDpisView.addSubview(exportHDPI);
    exportDpisView.addSubview(exportXHDPI);
    exportDpisView.addSubview(exportXXHDPI);
    exportDpisView.addSubview(exportXXXHDPI);
    dialog.addAccessoryView(exportDpisView);

    [exportMDPI, exportHDPI, exportXHDPI, exportXXHDPI, exportXXXHDPI].forEach(function(checkbox) {
        checkbox.setCOSJSTargetFunction(function(sender) {
            var dpiKey = checkbox.title().toLowerCase();
            if (sender.state()) {
                exportDpis.addObject(dpiKey);
            } else {
                exportDpis.removeObject(dpiKey);
            }
            if (exportDpis.count() == 0) {
                checkbox.setState(NSOnState);
                exportDpis.addObject(dpiKey);
                toast(context, localizedString(context, "least_export_dpis"));
            }
        });
    });

    // Asset name type
    var assetNameTypes = [
        localizedString(context, "asset_name_type_0"),
        localizedString(context, "asset_name_type_1"),
        localizedString(context, "asset_name_type_2"),
        localizedString(context, "asset_name_type_3")
    ];

    dialog.addAccessoryView(groupLabel(localizedString(context, "asset_name_type")));
    var assetNameType = popupButton(assetNameTypes);
    var currentAssetNameType = getPreferences(context, "asset_name_type");
    var currentAssetNameTypeIndex = currentAssetNameType != null ? currentAssetNameType : 0
    assetNameType.selectItemAtIndex(currentAssetNameTypeIndex);
    dialog.addAccessoryView(assetNameType);

    // Vector drawable folder
    dialog.addAccessoryView(groupLabel(localizedString(context, "vector_drawable_folder")));
    var vectordrawableFolder = popupButton(common.VECTORDRAWABLE_FOLDERS);
    var currentVectorFolder = getPreferences(context, "vector_drawable_folder");
    var currentVectorFolderIndex = currentVectorFolder ? currentVectorFolder : 0;
    vectordrawableFolder.selectItemAtIndex(currentVectorFolderIndex);
    dialog.addAccessoryView(vectordrawableFolder);

    // Language
    dialog.addAccessoryView(groupLabel(localizedString(context, "change_language")));
    var language = popupButton(Object.values(common.LANGUAGES));
    var currentLanguage = getPreferences(context, "language");
    var currentLanguageIndex = currentLanguage ? Object.keys(common.LANGUAGES).indexOf(String(currentLanguage)) : 0;
    language.selectItemAtIndex(currentLanguageIndex);
    dialog.addAccessoryView(language);

    // WebP Quality
    var defaultWebpQuality = getSystemPreference("WebPQuality") || 1;
    dialog.addAccessoryView(groupLabel(localizedString(context, "webp_quality")));
    var sliderWrapper = NSView.alloc().initWithFrame(NSMakeRect(0, 0, 300, 30));
    var slider = NSSlider.alloc().initWithFrame(NSMakeRect(0, 0, 230, 30));
    slider.setMaxValue(1);
    slider.setMinValue(0);
    slider.setFloatValue(defaultWebpQuality);
    slider.setNumberOfTickMarks(11);
    slider.setAllowsTickMarkValuesOnly(false);
    var sliderText = NSTextField.alloc().initWithFrame(NSMakeRect(250, 5, 50, 24));
    sliderText.setStringValue(floatToPercent(slider.value()));
    sliderWrapper.addSubview(slider);
    sliderWrapper.addSubview(sliderText);
    dialog.addAccessoryView(sliderWrapper);

    slider.setCOSJSTargetFunction(function(sender) {
        sliderText.setStringValue(floatToPercent(sender.value()));
    });

    // Vector Drawable path data float precision
    var defaultVectorDrawablePrecision = getPreferences(context, "vector_drawable_precision") || 2;
    dialog.addAccessoryView(groupLabel(localizedString(context, "vector_drawable_precision")));
    var sliderWrapper2 = NSView.alloc().initWithFrame(NSMakeRect(0, 0, 300, 30));
    var slider2 = NSSlider.alloc().initWithFrame(NSMakeRect(0, 0, 230, 30));
    slider2.setMaxValue(6);
    slider2.setMinValue(1);
    slider2.setFloatValue(defaultVectorDrawablePrecision);
    slider2.setNumberOfTickMarks(6);
    slider2.setAllowsTickMarkValuesOnly(true);

    var sliderText2 = NSTextField.alloc().initWithFrame(NSMakeRect(250, 5, 50, 24));
    sliderText2.setStringValue(slider2.value());
    sliderText2.setEditable(false);
    sliderWrapper2.addSubview(slider2);
    sliderWrapper2.addSubview(sliderText2);
    dialog.addAccessoryView(sliderWrapper2);

    slider2.setCOSJSTargetFunction(function(sender) {
        sliderText2.setStringValue(sender.value());
    });

    // Show in folder
    dialog.addAccessoryView(groupLabel(localizedString(context, "others")));
    var checkboxFinder = checkBox(
        getPreferences(context, "show_in_finder_after_export") == 1 ? true : false,
        localizedString(context, "show_in_finder_after_export")
    );
    dialog.addAccessoryView(checkboxFinder);

    // Disable Google Analytics
    var ga_uuid = getPreferences(context, "ga_uuid");
    var checkboxDisableGA = checkBox(
        (!ga_uuid || ga_uuid == "00000000-0000-0000-0000-000000000000") ? true : false,
        localizedString(context, "ga_disable")
    );
    dialog.addAccessoryView(checkboxDisableGA);

    dialog.addButtonWithTitle(localizedString(context, "ok"));
    dialog.addButtonWithTitle(localizedString(context, "cancel"));

    var responseCode = dialog.runModal();
    if (responseCode == 1000) {

        setPreferences(context, "export_dpis", exportDpis.allObjects());

        setPreferences(context, "asset_name_type", assetNameType.indexOfSelectedItem());

        setPreferences(context, "vector_drawable_folder", vectordrawableFolder.indexOfSelectedItem());

        var languageIndex = String(language.indexOfSelectedItem());
        var languageFileURL = context.plugin.urlForResourceNamed("manifest_" + Object.keys(common.LANGUAGES)[languageIndex] + ".json");
        if (fileExists(languageFileURL.path())) {
            var manifestFilePath = context.plugin.url().path() + "/Contents/Sketch/manifest.json";
            var languageFilePath = languageFileURL.path();
            // Remove manifest.json
            NSFileManager.defaultManager().removeItemAtPath_error_(
                manifestFilePath, nil
            );
            // Replace manifest.json
            NSFileManager.defaultManager().copyItemAtPath_toPath_error_(
                languageFilePath, manifestFilePath, nil
            );
            // User Default
            setPreferences(context, "language", Object.keys(common.LANGUAGES)[languageIndex]);
            // Reload Plugin
            AppController.sharedInstance().pluginManager().reloadPlugins();
        } else {
            var app = NSApplication.sharedApplication();
            app.displayDialog_withTitle_(
                localizedString(context, "language_file_not_found_desc", context.plugin.url().path() + "/Contents/Resources/manifest_" + Object.keys(common.LANGUAGES)[languageIndex] + ".json"),
                localizedString(context, "language_file_not_found")
            );
        }

        var webpQuality = slider.value();
        if (floatToPercent(slider.value()) != sliderText.stringValue()) {
            webpQuality = percentToFloat(sliderText.stringValue());
        }
        if (webpQuality == 1) {
            removeSystemPreference("WebPQuality");
        } else {
            setSystemPreference("WebPQuality", webpQuality);
        }

        setPreferences(context, "vector_drawable_precision", parseInt(sliderText2.stringValue()));

        setPreferences(context, "show_in_finder_after_export", checkboxFinder.state() == NSOnState ? true : false);

        setPreferences(context, "ga_disable", checkboxDisableGA.state() == NSOnState ? true : false);

    }
};

function groupLabel(text) {
    var view = NSTextField.alloc().initWithFrame(NSMakeRect(0, 0, 300, 16));
    view.setStringValue(String(text).toUpperCase());
    view.setFont(NSFont.systemFontOfSize(11));
    view.setTextColor(NSColor.grayColor());
    view.setBezeled(false);
    view.setDrawsBackground(false);
    view.setEditable(false);
    view.setSelectable(false);
    return view;
}

function checkBox(status, title, rect) {
    rect = rect || NSMakeRect(0, 0, 300, 16)
    var view = NSButton.alloc().initWithFrame(rect);
    view.setButtonType(NSSwitchButton);
    view.setTitle(title);
    if (status == true) {
        view.setState(NSOnState);
    } else {
        view.setState(NSOffState);
    }
    return view;
}

function popupButton(items) {
    var view = NSPopUpButton.alloc().initWithFrame(NSMakeRect(0, 0, 300, 24));
    items.forEach(function(item) {
        view.addItemWithTitle("");
        view.lastItem().setTitle(item);
    });
    return view;
}

function divider() {
    var view = NSView.alloc().initWithFrame(NSMakeRect(0, 0, 300, 1));
    view.setWantsLayer(true);
    view.layer().setBackgroundColor(CGColorCreateGenericRGB(0, 0, 0, 0.1));
    return view;
}

function floatToPercent(float) {
    return Math.round(parseFloat(float) * 100) + "%";
}

function percentToFloat(percent) {
    return Math.min(parseFloat(percent) / 100, 1);
}

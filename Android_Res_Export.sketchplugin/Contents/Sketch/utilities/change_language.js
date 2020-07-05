var preferences = require("../lib/preferences");
var localizedString = require("../lib/localizedString");
var io = require("../lib/io");
var message = require("../lib/message");

var getPreferences = preferences.getPreferences;
var fileExists = io.fileExists;
var getJSONFromPath = io.getJSONFromPath;
var toast = message.toast;

var changeLanguage = function(context) {

    // Reload Plugin
    AppController.sharedInstance().pluginManager().reloadPlugins();

    var manifestPath = context.plugin.url().path() + "/Contents/Sketch/manifest.json";
    var manifest = getJSONFromPath(manifestPath);
    var manifestLanguage = manifest.language;

    var userLanguage = getPreferences(context, "language") || "en";

    if (manifestLanguage != userLanguage) {
        var languageFilePath = context.plugin.urlForResourceNamed("manifest_" + userLanguage + ".json").path();
        var manifestFilePath = context.plugin.url().path() + "/Contents/Sketch/manifest.json";
        if (fileExists(languageFilePath)) {
            // Remove manifest.json
            NSFileManager.defaultManager().removeItemAtPath_error_(
                manifestFilePath, nil
            );
            // Replace manifest.json
            NSFileManager.defaultManager().copyItemAtPath_toPath_error_(
                languageFilePath, manifestFilePath, nil
            );
            AppController.sharedInstance().pluginManager().reloadPlugins();
        } else {
            var message = localizedString(context, "language_file_not_found_desc", context.plugin.url().path() + "/" + languageFilePath);
            toast(context, message);
        }
    }

};

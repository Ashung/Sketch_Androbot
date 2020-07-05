var getPreferences = require("./preferences").getPreferences;
var getJSONFromPath = require("./io").getJSONFromPath;

module.exports = function(context, langKey) {
    var currentLanguageSetting = getPreferences(context, "language");
    var languageFilePath = context.plugin.urlForResourceNamed("language_" + currentLanguageSetting + ".json").path();
    var langString = getJSONFromPath(languageFilePath)[langKey];
    for (var i = 2; i < arguments.length; i++) {
        var regExp = new RegExp("\%" + (i-1), "g");
        langString = langString.replace(regExp, arguments[i]);
    }
    return langString;
} 
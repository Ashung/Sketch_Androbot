function getPreferences(context, key) {
    var identifier = context.plugin.identifier();
    var userDefaults = NSUserDefaults.standardUserDefaults();
    if (!userDefaults.dictionaryForKey(identifier)) {
        var defaultPreferences = NSMutableDictionary.alloc().init();
        defaultPreferences.setObject_forKey("en", "language");
        defaultPreferences.setObject_forKey(true, "show_in_finder_after_export");
        defaultPreferences.setObject_forKey(false, "use_imageoptim_after_export");
        userDefaults.setObject_forKey(defaultPreferences, identifier);
        userDefaults.synchronize();
    }
    return userDefaults.dictionaryForKey(identifier).objectForKey(key);
}

function setPreferences(context, key, value) {
    var identifier = context.plugin.identifier();
    var userDefaults = NSUserDefaults.standardUserDefaults();
    if (!userDefaults.dictionaryForKey(identifier)) {
        var preferences = NSMutableDictionary.alloc().init();
    } else {
        var preferences = NSMutableDictionary.dictionaryWithDictionary(userDefaults.dictionaryForKey(identifier));
    }
    preferences.setObject_forKey(value, key);
    userDefaults.setObject_forKey(preferences, identifier);
    userDefaults.synchronize();
}

function getSystemPreference(key) {
    var userDefaults = NSUserDefaults.standardUserDefaults();
    return userDefaults.objectForKey(key);
}

function setSystemPreference(key, value) {
    var userDefaults = NSUserDefaults.standardUserDefaults();
    userDefaults.setObject_forKey(value, key);
    userDefaults.synchronize();
}

function removeSystemPreference(key) {
    var userDefaults = NSUserDefaults.standardUserDefaults();
    userDefaults.removeObjectForKey(key);
    userDefaults.synchronize();
}

module.exports.getPreferences = getPreferences;
module.exports.setPreferences = setPreferences;
module.exports.getSystemPreference = getSystemPreference;
module.exports.setSystemPreference = setSystemPreference;
module.exports.removeSystemPreference = removeSystemPreference;

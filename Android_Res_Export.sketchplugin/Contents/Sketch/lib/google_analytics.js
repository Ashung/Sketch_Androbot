// Google Analytics

var preferences = require("./preferences");
var getPreferences = preferences.getPreferences;
var setPreferences = preferences.setPreferences;

module.exports = function(context, eventCategory, eventAction, eventLabel, eventValue) {

    var uuid = getPreferences(context, "ga_uuid");
    if (!uuid) {
        var dialog = NSAlert.alloc().init();
        var icon = NSImage.alloc().initWithContentsOfURL(context.plugin.urlForResourceNamed("icon.png"));
        dialog.setIcon(icon);
        dialog.setMessageText("Android Res Export");
        dialog.setInformativeText(localizedString(context, "ga_tip"));
        dialog.addButtonWithTitle(localizedString(context, "agree"));
        dialog.addButtonWithTitle(localizedString(context, "disagree"));
        var responseCode = dialog.runModal();
        if (responseCode == 1000) {
            setPreferences(context, "ga_uuid", NSUUID.UUID().UUIDString());
        }
        if (responseCode == 1001) {
            setPreferences(context, "ga_uuid", "00000000-0000-0000-0000-000000000000");
        }
    }

    uuid = getPreferences(context, "ga_uuid");
    if (uuid == "00000000-0000-0000-0000-000000000000") {
        return;
    }

    var trackingID = "UA-99098773-1",
        appName = encodeURI(context.plugin.name()),
        appId = context.plugin.identifier(),
        appVersion = context.plugin.version();

    var url = "https://www.google-analytics.com/collect?v=1";
    // Tracking ID
    url += "&tid=" + trackingID;
    // Source
    url += "&ds=sketch" + MSApplicationMetadata.metadata().appVersion;
    // Client ID
    url += "&cid=" + uuid;
    // User GEO location
    url += "&geoid=" + NSLocale.currentLocale().countryCode();
    // User language
    url += "&ul=" + NSLocale.currentLocale().localeIdentifier().toLowerCase();
    // pageview, screenview, event, transaction, item, social, exception, timing
    url += "&t=event";
    // App Name
    url += "&an=" + appName;
    // App ID
    url += "&aid=" + appId;
    // App Version
    url += "&av=" + appVersion;
    // Event category
    url += "&ec=" + encodeURI(eventCategory);
    // Event action
    url += "&ea=" + encodeURI(eventAction);
    // Event label
    if (eventLabel) {
        url += "&el=" + encodeURI(eventLabel);
    }
    // Event value
    if (eventValue) {
        url += "&ev=" + encodeURI(eventValue);
    }

    var session = NSURLSession.sharedSession();
    var task = session.dataTaskWithURL(NSURL.URLWithString(NSString.stringWithString(url)));
    task.resume();

}

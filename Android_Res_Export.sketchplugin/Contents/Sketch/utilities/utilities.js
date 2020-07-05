var ga = require("../lib/google_analytics");

var website = function(context) {
    ga(context, "Web", "website");
    NSWorkspace.sharedWorkspace().openURL(context.plugin.homepageURL());
};

var reportIssues = function(context) {
    ga(context, "Web", "issues");
    NSWorkspace.sharedWorkspace().openURL(context.plugin.homepageURL().URLByAppendingPathComponent("issues"));
};

var donate = function(context) {
    ga(context, "Web", "donate");
    NSWorkspace.sharedWorkspace().openURL(NSURL.URLWithString("https://ashung.github.io/donate.html?ref=android_res_export"));
};

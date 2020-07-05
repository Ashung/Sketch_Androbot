var VECTORDRAWABLE_FOLDERS = [
    "drawable",
    "drawable-anydpi",
    "drawable-anydpi-v21",
    "drawable-anydpi-v24"
];

var LANGUAGES = {
    "en": "English",
    "zh_cn": "简体中文"
};

var DPIS = {
    "mdpi": 1,
    "hdpi": 1.5,
    "xhdpi": 2,
    "xxhdpi": 3,
    "xxxhdpi": 4
};

function dpiToScale(dpi) {
    if (DPIS[dpi]) {
        return DPIS[dpi];
    }
    return 1;
}

function assetName(layer, type) {
    var nameArray = String(layer.name()).split(/\s*\/\s*/);
    var name;
    // Valid last part of layer name.
    if (type == 0 || type == null) {
        name = cleanName(nameArray[nameArray.length - 1]).replace(/^\d+_*/, "");
    }
    // Valid full layer name
    else if (type == 1) {
        var nameParts = [];
        nameArray.forEach(function(part) {
            nameParts.push(cleanName(part));
        });
        name = nameParts.join("_").replace(/^\d+_*/, "");
    }
    // Last part of layer name.
    else if (type == 2) {
        name = nameArray[nameArray.length - 1];
        name = name.replace(/[`~!@#$%^&*+=:;,<>?|(){}\[\]\\]/g, "");
        name = name.trim();
    }
    // Full layer name
    else if (type == 3) {
        name = String(layer.name()).replace(/\s*\/\s*/g, "_");
        name = name.replace(/[`~!@#$%^&*+=:;,<>?|(){}\[\]\\]/g, "");
        name = name.trim();
    }

    if (
        name == "" ||
        (name.match(/_/g) != null && name.match(/_/g).length == name.length)
    ) {
        return "untitled_" + layer.objectID().substringToIndex(8).lowercaseString();
    }
    return name;
}

function cleanName(name) {
    // Latin to ascii
    var latinToAsciiMapping = {
        "ae": "ä|æ|ǽ",
        "oe": "ö|œ",
        "ue": "ü",
        "Ae": "Ä",
        "Ue": "Ü",
        "Oe": "Ö",
        "A": "À|Á|Â|Ã|Ä|Å|Ǻ|Ā|Ă|Ą|Ǎ",
        "a": "à|á|â|ã|å|ǻ|ā|ă|ą|ǎ|ª",
        "C": "Ç|Ć|Ĉ|Ċ|Č",
        "c": "ç|ć|ĉ|ċ|č",
        "D": "Ð|Ď|Đ",
        "d": "ð|ď|đ",
        "E": "È|É|Ê|Ë|Ē|Ĕ|Ė|Ę|Ě",
        "e": "è|é|ê|ë|ē|ĕ|ė|ę|ě",
        "G": "Ĝ|Ğ|Ġ|Ģ",
        "g": "ĝ|ğ|ġ|ģ",
        "H": "Ĥ|Ħ",
        "h": "ĥ|ħ",
        "I": "Ì|Í|Î|Ï|Ĩ|Ī|Ĭ|Ǐ|Į|İ",
        "i": "ì|í|î|ï|ĩ|ī|ĭ|ǐ|į|ı",
        "J": "Ĵ",
        "j": "ĵ",
        "K": "Ķ",
        "k": "ķ",
        "L": "Ĺ|Ļ|Ľ|Ŀ|Ł",
        "l": "ĺ|ļ|ľ|ŀ|ł",
        "N": "Ñ|Ń|Ņ|Ň",
        "n": "ñ|ń|ņ|ň|ŉ",
        "O": "Ò|Ó|Ô|Õ|Ō|Ŏ|Ǒ|Ő|Ơ|Ø|Ǿ",
        "o": "ò|ó|ô|õ|ō|ŏ|ǒ|ő|ơ|ø|ǿ|º",
        "R": "Ŕ|Ŗ|Ř",
        "r": "ŕ|ŗ|ř",
        "S": "Ś|Ŝ|Ş|Š",
        "s": "ś|ŝ|ş|š|ſ",
        "T": "Ţ|Ť|Ŧ",
        "t": "ţ|ť|ŧ",
        "U": "Ù|Ú|Û|Ũ|Ū|Ŭ|Ů|Ű|Ų|Ư|Ǔ|Ǖ|Ǘ|Ǚ|Ǜ",
        "u": "ù|ú|û|ũ|ū|ŭ|ů|ű|ų|ư|ǔ|ǖ|ǘ|ǚ|ǜ",
        "Y": "Ý|Ÿ|Ŷ",
        "y": "ý|ÿ|ŷ",
        "W": "Ŵ",
        "w": "ŵ",
        "Z": "Ź|Ż|Ž",
        "z": "ź|ż|ž",
        "AE": "Æ|Ǽ",
        "ss": "ß",
        "IJ": "Ĳ",
        "ij": "ĳ",
        "OE": "Œ",
        "f": "ƒ",
    };
    for (var i in latinToAsciiMapping) {
        var regexp = new RegExp(latinToAsciiMapping[i], "g");
        name = name.replace(regexp, i);
    }
    // Remove no ascii character
    name = name.replace(/[^\u0020-\u007E]/g, "");
    // Remove unsupport character
    name = name.replace(/[\u0021-\u002B\u003A-\u0040\u005B-\u005E\u0060\u007B-\u007E]/g, "");
    // Unix hidden file
    name = name.replace(/^\./, "");
    // , - . _ to space
    name = name.replace(/[\u002C-\u002E\u005F]/g, "_");
    // Replace space to _
    name = name.trim();
    name = name.replace(/\s+/g, "_");
    name = name.toLowerCase();
    return name;
}

function colorToAndroid(mscolor) {
    var alpha = mscolor.alpha();
    var hex = mscolor.immutableModelObject().hexValue();
    if (alpha < 1) {
        var alphaHex = Math.round(alpha * 255).toString(16);
        if (alphaHex.length == 1) {
            alphaHex = "0" + alphaHex;
        }
        return "#" + alphaHex.toUpperCase() + hex;
    } else {
        return "#" + hex;
    }
}

function gradientStopsToColorArray(stops) {
    var result = [];
    var loop = stops.objectEnumerator();
    while (stop = loop.nextObject()) {
        result.push(colorToAndroid(stop.color()));
    }
    return result;
}

module.exports.VECTORDRAWABLE_FOLDERS = VECTORDRAWABLE_FOLDERS;
module.exports.LANGUAGES = LANGUAGES;
module.exports.DPIS = DPIS;
module.exports.dpiToScale = dpiToScale;
module.exports.assetName = assetName;
module.exports.cleanName = cleanName;
module.exports.colorToAndroid = colorToAndroid;
module.exports.gradientStopsToColorArray = gradientStopsToColorArray;



/* =========================================================
    Sketch
========================================================= */

/* =========================================================
    Command line tools
========================================================= */

function which(command) {
    var path = "";
    runCommand("/bin/bash", ["-l", "-c", "which " + command], function(status, msg) {
        if (status && msg != "") {
            path += msg;
            path = path.replace(/\s*$/g, "");
        }
    });
    return path;
}

function runCommand(command, args, callback) {
    var task = NSTask.alloc().init();
    var pipe = NSPipe.pipe();
    var errPipe = NSPipe.pipe();
        task.setLaunchPath(command);
        task.setArguments(args);
        task.setStandardOutput(pipe);
        task.setStandardError(errPipe);
        task.launch();
        task.waitUntilExit();
    var errorData = errPipe.fileHandleForReading().readDataToEndOfFile();
    if (errorData != nil && errorData.length()) {
        var message = NSString.alloc().initWithData_encoding_(errorData, NSUTF8StringEncoding);
        if (callback && typeof(callback) == "function") {
            callback(
                task.terminationStatus() == 0,
                message
            );
            return;
        } else {
            return NSException.raise_format_("failed", message);
        }
    }
    var data = pipe.fileHandleForReading().readDataToEndOfFile();
    if (callback && typeof(callback) == "function") {
        callback(
            task.terminationStatus() == 0,
            NSString.alloc().initWithData_encoding_(data, NSUTF8StringEncoding)
        );
    }
}

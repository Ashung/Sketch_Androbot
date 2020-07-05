function toast(context, message) {
    context.document.showMessage(message);
}

function alert(context, title, content) {
    var dialog = COSAlertWindow.alloc().init();
    dialog.setMessageText(title);
    dialog.setInformativeText(content);
    var iconPath = context.plugin.urlForResourceNamed("icon.png").path();
    var iconNSImage = NSImage.alloc().initWithContentsOfFile(iconPath);
    dialog.setIcon(iconNSImage);
    dialog.addButtonWithTitle("OK");
    dialog.addButtonWithTitle("Cancel");
    return dialog.runModal();
}

module.exports.toast = toast;
module.exports.alert = alert;
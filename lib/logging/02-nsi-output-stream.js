var NSIOutputStream = class {
    constructor() {
        this.nsIFileOutputStream = Components.classes["@mozilla.org/network/file-output-stream;1"].createInstance(Components.interfaces.nsIFileOutputStream);
    }

    init(logFile, flags) {
        this.nsIFileOutputStream.init(logFile, flags, 0o666, 0);
    }
}
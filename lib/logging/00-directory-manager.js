Components.utils.import("resource://gre/modules/FileUtils.jsm");

class DirectoryManager {
    constructor() {
        this.dataDirectory = new FileUtils.File(Zotero.DataDirectory.dir);
        this.dataDirectory.append('logs');

        this.initializeDirectory();
    }

    initializeDirectory() {
        this.dataDirectory.append("ZotMoov");
        if (!this.dataDirectory.exists() || !this.dataDirectory.isDirectory()) {
            this.dataDirectory.create(Components.interfaces.nsIFile.DIRECTORY_TYPE, 0o755);
        }
        this.logFile = this.dataDirectory.clone();
        this.logFile.append("log.txt");
    }

    getLogFile() {
        return this.logFile;
    }
}
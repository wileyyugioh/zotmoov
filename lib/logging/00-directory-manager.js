class DirectoryManager {
    constructor() {
        this.directoryService = Components.classes["@mozilla.org/file/directory_service;1"].getService(Components.interfaces.nsIProperties);
        this.dataDirectory = this.directoryService.get("LocalAppData", Components.interfaces.nsIFile);
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
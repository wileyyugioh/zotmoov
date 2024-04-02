var OutputManager = class extends IOutputManager {
    constructor(directoryManager) {
        super();
        this._logFile = directoryManager.getLogFile();
        this.nsIOutputStream = new NSIOutputStream();
        this.nsIConverterOutputStream = new NSIConverterOutputStream();
    }

    write(formattedMessage, overwrite = false, removeEmptyLines = false) {
        const flags = overwrite ? 0x02 | 0x08 | 0x20 :  0x02 | 0x08 | 0x10;
        this.nsIOutputStream.init(this._logFile, flags);
        this.nsIConverterOutputStream.init(this.nsIOutputStream.nsIFileOutputStream, "UTF-8");

        formattedMessage = removeEmptyLines ? formattedMessage : `${formattedMessage}\n\n`;
        this.nsIConverterOutputStream.writeString(formattedMessage);
        this.nsIConverterOutputStream.close();
    }
}
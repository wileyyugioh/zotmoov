var NSIConverterOutputStream = class {
    constructor() {
        this.nsIConverterOutputStream = Components.classes["@mozilla.org/intl/converter-output-stream;1"].createInstance(Components.interfaces.nsIConverterOutputStream);
    }

    init(outputStream, encoding) {
        this.nsIConverterOutputStream.init(outputStream, encoding, 0, 0);
    }

    writeString(formattedMessage) {
        this.nsIConverterOutputStream.writeString(`${formattedMessage}`);
    }

    close() {
        this.nsIConverterOutputStream.close();
    }
}
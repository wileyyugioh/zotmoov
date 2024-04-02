/**
 * Represents an output manager.
 * @class
 */
var IOutputManager = class {
    write(formattedMessage, overwrite = false, removeEmptyLines = false) {
        throw new Error("You have to implement the method write!");
    }
}
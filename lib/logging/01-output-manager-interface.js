/**
 * Represents an output manager.
 * @class
 */
class IOutputManager {
    write(formattedMessage, overwrite = false, removeEmptyLines = false) {
        throw new Error("You have to implement the method write!");
    }
}
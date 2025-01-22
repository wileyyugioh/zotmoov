var FormattingStrategyInterface = class {
    constructor() {
        if (this.constructor === FormattingStrategyInterface) {
            throw new Error("Interfaces can't be instantiated directly.");
        }
    }

    /**
     * Formats the given creator model into a string of the implemented format.
     * @param creator The creator model to format.
     * @returns {string} A string of the implemented format.
     */
    formatCreator (creator) {
        throw new Error("Implement this method.");
    }
}


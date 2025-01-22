var BlockInterface = class {
    /**
     * @param substitutions {TemplatePossibility[]} - The list of substitutions to apply to this block.
     */
    constructor(substitutions) {
        if (this.constructor === BlockInterface) {
            throw new Error("Interfaces can't be instantiated directly.");
        }
    }

    /**
     * Substitutes values in a given block of text using predefined substitutions.
     *
     * @param {string} block - The block of text to be substituted.
     * @returns {string} - The block of text after substitutions have been made.
     */
    substitute(block) {
        throw new Error("You have to implement the method substitute!");
    }
}


var DefaultBlock = class extends BlockInterface {
    /**
     * Represents a normal block substitution.
     * @param substitutions {TemplatePossibility[]} - The list of substitutions to apply to this block.
     */
    constructor(substitutions) {
        super(substitutions);
        this.substitutions = substitutions || [];
    }

    /**
     * Substitutes values in a given block of text using predefined substitutions.
     *
     * @param {string} block - The block of text to be substituted.
     * @returns {string} - The block of text after substitutions have been made.
     */
    substitute(block) {
        this.substitutions.forEach((templatePossibility) => {
            block = block.replace(templatePossibility.search, templatePossibility.replace);
        });

        return block;
    }
}


class ConditionalBlock extends BlockInterface {
    /**
     * Represents a normal block substitution.
     * @param substitutions {TemplatePossibility[]} - The list of substitutions to apply to this block.
     */
    constructor(substitutions) {
        super(substitutions);
        this.substitutions = substitutions || [];
    }

    _canSubstitute() {
        return this.substitutions.every((templatePossibility) => templatePossibility.canSubstitute());
    }

    /**
     * Substitutes values in a given block of text using predefined substitutions.
     *
     * @param {string} block - The block of text to be substituted.
     * @returns {string} - The block of text after substitutions have been made.
     */
    substitute(block) {
        if (!this._canSubstitute()) {
            return "";
        }

        this.substitutions.forEach((templatePossibility) => {
            block = block.replace(templatePossibility.search, templatePossibility.replace);
        });

        block = block.substring(1, block.length - 1);
        return block;
    }
}


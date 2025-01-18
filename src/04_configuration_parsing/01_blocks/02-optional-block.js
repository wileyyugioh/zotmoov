class OptionalBlock extends BlockInterface {
    /**
     * Represents a block with optional substitutions.
     * @param substitutions {TemplatePossibility[]} - The list of substitutions to apply to this block in order.
     */
    constructor(substitutions) {
        super(substitutions);

        /**
         * @type {TemplatePossibility[]}
         */
        this.substitutions = substitutions || [];
    }

    _canSubstitute() {
        for (let substitution of this.substitutions) {
            if (substitution.replace !== "") return true;
        }

        return false;
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

        for (let substitution of this.substitutions) {
            if (substitution.replace !== "") {
                const substitution_number = this.substitutions.indexOf(substitution);

                block = this._clean_before(block, substitution_number);
                block = this._clean_after(block, substitution_number);

                block = block.replace(substitution.search, substitution.replace);
                return block;
            }
        }
    }

    /**
     * @param block {string}
     * @param substitution_number {int}
     * @private
     */
    _clean_before(block, substitution_number) {
        let first_substitution = this.substitutions[0];
        const first_index = block.indexOf(first_substitution.search);
        const end_index = block.indexOf(this.substitutions[substitution_number].search)

        if (first_index !== end_index) {
            let to_remove = block.slice(first_index, end_index);
            return block.replace(to_remove, "");
        }

        return block;
    }

    _clean_after(block, substitution_number) {
        let last_substitution = this.substitutions[-1];
        const this_substitution = this.substitutions[substitution_number];

        const first_index = block.indexOf(this_substitution.search) + this_substitution.search.length;
        const end_index = block.indexOf(last_substitution.search) + last_substitution.search.length;

        if (first_index !== end_index) {
            let to_remove = block.slice(first_index, end_index);
            return block.replace(to_remove, "");
        }

        block = block.substring(1, block.length - 1);
        return block;
    }
}


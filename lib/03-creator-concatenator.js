class CreatorConcatenator {
    constructor(max_number_of_creators, delimiter) {
        this._max_number_of_authors = max_number_of_creators;
        this._delimiter = delimiter;
    }

    /**
     * @param creators {CreatorModel[]} The creators to concatenate.
     * @param format {CreatorFormattingType} The format to use for the concatenation.
     * @param appendEtAl {boolean} Whether to append the 'et al.' to the concatenated authors when the number exceeds the maximum.
     * When turned off, max number of creators has no effect.
     * @returns {string} The concatenated authors in the specified format.
     */
    concatenate(creators, format, appendEtAl = false) {
        let concatenated = '';

        for (let i = 0; i < creators.length; ++i) {
            if (appendEtAl && i >= this._max_number_of_authors){
                concatenated += " et al.";
                break;
            }

            const creator = creators[i];
            concatenated += concatenated ? this._delimiter + creator.getFormat(format) : creator.getFormat(format);
        }

        return concatenated;
    }
}

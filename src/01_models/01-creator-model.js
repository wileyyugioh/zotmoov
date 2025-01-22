var CreatorModel = class {
    get creatorType() {
        return this._creatorType;
    }

    /**
     * @returns {string}
     */
    get initials() {
        return this._initials;
    }

    /**
     * @returns {string}
     */
    get firstName() {
        return this._firstName;
    }

    /**
     * @returns {string}
     */
    get lastName() {
        return this._lastName;
    }

    /**
     * @param desiredFormat {CreatorFormattingType}
     * @returns {string} The string of the chosen format.
     */
    getFormat(desiredFormat) {
        return this._strategyChooser.getStrategy(desiredFormat).formatCreator(this);
    }

    constructor(firstName, lastName, initials, creatorType) {
        this._firstName = firstName;
        this._lastName = lastName;
        this._initials = initials;
        this._creatorType = creatorType;
        this._strategyChooser = new FormattingStrategyChooser();
    }
}


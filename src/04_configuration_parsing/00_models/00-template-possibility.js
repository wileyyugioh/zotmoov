var TemplatePossibility = class {
    /**
     * @returns {string}
     */
    get search() {
        return this._search;
    }

    /**
     * @returns {string}
     */
    get replace() {
        return this._replace;
    }

    canSubstitute() {
        return this._replace !== null;
    }

    /**
     * @param search {string} - The string to search for.
     * @param replace {string} - The string to replace with.
     */
    constructor(search, replace) {
        this._search = search;
        this._replace = replace;
    }
}
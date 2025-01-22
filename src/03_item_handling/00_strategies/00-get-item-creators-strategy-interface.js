var GetItemCreatorsStrategyInterface = class {
    constructor() {
        if (this.constructor === GetItemCreatorsStrategyInterface) {
            throw new Error("Interfaces can't be instantiated directly.");
        }
    }

    /**
     * Gets the item creators for the given zotero item.
     * @param zoteroItem The zotero item to get the item creators for.
     * @returns {CreatorModel[]} The item creators.
     */
    get(zoteroItem) {
        throw new Error("Implement this method.");
    }
}

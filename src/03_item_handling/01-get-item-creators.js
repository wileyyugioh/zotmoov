var GetItemCreators = class {
    /**
     * Creates a new instance of the GetItemCreators class.
     *
     * @param {CreatorModelFactory} creatorModelFactory - The factory used to create creator models.
     * @param zotDebugger {ZotMoovDebugger} - The ZotMoovDebugger object.
     */
    constructor(creatorModelFactory, zotDebugger) {
        this._strategyGetter = new GetItemCreatorStrategyGetter(creatorModelFactory, zotDebugger);
    }

    /**
     * @param zoteroItem - The Zotero Item.
     * @param creatorType {CreatorType} - the type of creator to get.
     * @returns {CreatorModel[]} An array of ItemModels.
     */
    get(zoteroItem, creatorType) {
        return this._strategyGetter.getStrategy(creatorType).get(zoteroItem);
    }
}


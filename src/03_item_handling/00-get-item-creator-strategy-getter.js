class GetItemCreatorStrategyGetter {
    /**
     * Creates a new instance of the class.
     *
     * @param {CreatorModelFactory} creatorFactory - The creator factory object.
     * @param {ZotMoovDebugger} zotDebugger - The zot debugger object.
     */
    constructor(creatorFactory, zotDebugger) {
        this._creatorFactory = creatorFactory;
        this._zotDebugger = zotDebugger;
    }

    /**
     * Gets the strategy for the given creator type.
     * @param creatorType {CreatorType} - The creator type.
     * @returns {GetItemCreatorsStrategyInterface} - The strategy for the given creator type.
     */
    getStrategy(creatorType) {
        switch (creatorType) {
            case CreatorType.AUTHOR:
                return new GetItemAuthorsStrategy(this._creatorFactory);
            case CreatorType.EDITOR:
                return new GetItemEditorsStrategy(this._creatorFactory);
            default:
                const err = `Invalid creator type: ${creatorType}`;
                this._zotDebugger.error(err);
                throw new Error(err);
        }
    }
}


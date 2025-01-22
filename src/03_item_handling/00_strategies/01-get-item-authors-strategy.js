var GetItemAuthorsStrategy = class extends GetItemCreatorsStrategyInterface {
    /**
     *
     * @param {CreatorModelFactory} creatorFactory - The creator factory to use.
     */
    constructor(creatorFactory) {
        super();
        this._creatorFactory = creatorFactory;
    }

    get(zoteroItem) {
        const zoteroCreators = zoteroItem.getCreators();
        const zoteroCreatorTypeIDs = [Zotero.CreatorTypes.getPrimaryIDForType(zoteroItem.itemTypeID)];

        let authors = [];

        for (let i = 0; i < zoteroCreators.length; ++i) {
            const zoteroCreator = zoteroCreators[i];

            if (zoteroCreatorTypeIDs.indexOf(zoteroCreator.creatorTypeID) !== -1) {
                const author = this._creatorFactory.create(zoteroCreator, CreatorType.AUTHOR);
                authors.push(author);
            }
        }

        return authors;
    }
}


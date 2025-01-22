class ItemFactory {
    constructor(creatorModelFactory, zotMoovDebugger, fileSanitizer, maxAuthors = 3, delimiter =  '\ ') {
        this._creatorModelFactory = creatorModelFactory;
        this._zotDebugger = zotMoovDebugger;
        this._fileSanitizer = fileSanitizer;
        this._maxAuthors = maxAuthors;
        this._delimiter = delimiter;
    }

    /**
     * @param zoteroItem {object} - The Zotero item to create from.
     * @returns {Item} - The created item.
     */
    createItem(zoteroItem) {
        return new Item(
            zoteroItem,
            this._creatorModelFactory,
            this._zotDebugger,
            this._fileSanitizer,
            this._maxAuthors,
            this._delimiter
        );
    }
}

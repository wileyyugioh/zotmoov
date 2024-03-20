/**
 * Custom item class (a kind of wrapper around a Zotero Item).
 * To make working with items in the plugin easier.
 */
class Item {
    /**
     * @returns {string}
     */
    get item_type_english() { return Zotero.ItemTypes.getName(this._itemTypeId); }

    /**
     * @returns {string}
     */
    get item_type_localized() { return Zotero.ItemTypes.getLocalizedString(this._itemTypeId); }

    /**
     * @returns {string}
     */
    get title_original() { return this._titleOriginal; }

    /**
     * @returns {string}
     */
    get title_cleaned() { return this._titleCleaner.truncateTitle(this._titleOriginal); }

    /**
     * Returns the concatenated creators in the specified format.
     *
     * @param creatorType {CreatorType} - The desired format for the creators.
     * @param {CreatorFormattingType} format - The format to be used for concatenation.
     * @returns {string} - The concatenated creators in the specified format.
     */
    get_concatenated_creators(creatorType, format) {
        // Authors are the only ones that need to be appended with et al.
        // In case multiple types of creators need this, we will move to a strategy pattern.
        const creators = this._getItemCreators.get(this._zoteroItem, creatorType);

        if (creatorType === CreatorType.AUTHOR) {
            return this._concatenator.concatenate(creators, format, true);
        }

        return this._concatenator.concatenate(creators, format, false);
    }

    /**
     * Retrieves the last creator in the list and returns their information in the specified format.
     *
     * @param creatorType {CreatorType} - The desired format for the creator's information.'
     * @param {CreatorFormattingType} format - The desired format for the creator's information.
     * @returns {string} - The creator's information in the specified format.
     */
    get_last_creator(creatorType, format) {
        const creators = this._getItemCreators.get(this._zoteroItem, creatorType)

        return creators[creators.length - 1].getFormat(format);
    }

    /**
     * @returns {string}
     */
    get collection_paths() { return this._collectionPaths; }

    /**
     * @returns {string}
     */
    get cite_key() { return this._citekey; }

    /**
     * @returns {string}
     */
    get year() { return this._year; }

    /**
     * @returns {string}
     */
    get journal_abbreviation() { return this._journalAbbrev; }

    /**
     * @returns {string}
     */
    get publication() { return this._publication; }

    /**
     * @returns {string}
     */
    get publisher() { return this._publisher; }

    /**
     * @returns {string}
     */
    get volume() { return this._volume; }

    /**
     * @returns {string}
     */
    get issue() { return this._issue; }

    /**
     * @returns {string}
     */
    get pages() { return this._pages; }

    /**
     * @returns {Item}
     */
    get parent_item() { return this._parentItem; }

    /**
     * @returns {bool}
     */
    get is_attachment() { return this._isAttachment; }

    /**
     * Instantiates a new ItemModel object based on the Zotero Item.
     * @param zoteroItem The Zotero Item.
     * @param creatorModelFactory {CreatorModelFactory} The creator model factory.
     * @param zotDebugger {ZotMoovDebugger} The ZotMoovDebugger object.
     * @param fileSanitizer {FileNameSanitizer} The file sanitizer.
     * @param maxAuthors {int} The maximum number of authors to include before adding 'et al.'
     * @param delimiter {string} The delimiter to use between the authors.
     */
    constructor(
        zoteroItem,
        creatorModelFactory,
        zotDebugger,
        fileSanitizer,
        maxAuthors = 3,
        delimiter = '\ ')
    {
        this._debugger = zotDebugger;

        if (zoteroItem === undefined) {
            this._debugger.error("Zotero item is undefined... wtf.");
            return;
        }

        try {
            this._zoteroItem = zoteroItem;
            this._itemTypeId = zoteroItem.itemTypeID;
            this._titleOriginal = zoteroItem.getField("title", false, true);
            this._titleCleaner = new TitleCleaner();
            this._concatenator = new CreatorConcatenator(maxAuthors, delimiter);
            this._getItemCreators = new GetItemCreators(creatorModelFactory, zotDebugger);
            const getItemCollectionPaths = new GetItemCollectionPaths(fileSanitizer);

            this._collectionPaths = getItemCollectionPaths.get(zoteroItem);
            this._citekey = Zotero.BetterBibTeX ? zoteroItem.getField('citationKey') : '';
            this._year = zoteroItem.getField('year', false, true);
            this._journalAbbrev = zoteroItem.getField('journalAbbreviation', false, true);
            this._publication = zoteroItem.getField('publicationTitle', false, true);
            this._publisher = zoteroItem.getField('publisher', false, true);
            this._volume = zoteroItem.getField('volume', false, true);
            this._issue = zoteroItem.getField('issue', false, true);
            this._pages = zoteroItem.getField('pages', false, true);

            if (zoteroItem.parentItem !== undefined) {
                this._parentItem = new Item(zoteroItem.parentItem, creatorModelFactory, zotDebugger, fileSanitizer, maxAuthors, delimiter);
            }

            this._isAttachment = zoteroItem.isAttachment();
        }
        catch (e) {
            this._debugger.error(e);
            throw e;
        }
    }
}
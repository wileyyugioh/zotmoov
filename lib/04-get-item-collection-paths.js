var GetItemCollectionPaths = class {
    /**
     * Creates a new instance of the constructor.
     *
     * @param {FileNameSanitizer} fileSanitizer - The FileSanitizer object used for sanitizing files.
     */
    constructor(fileSanitizer) {
        this._fileSanitizer = fileSanitizer;
    }

    /**
     * Retrieves the path of the given zoteroItem.
     *
     * @param {Object} zoteroItem - The Zotero item for which to retrieve the path.
     * @returns {string} The path of the collections.
     */
    get(zoteroItem) {
        // Get parent collection if parent is present
        let collection_ids = zoteroItem.parentID ? zoteroItem.parentItem.getCollections() : zoteroItem.getCollections();

        let path = ''
        if(collection_ids.length)
        {
            let collections = Zotero.Collections.get(collection_ids);
            let collection_names = this._getCollectionNamesHierarchy(collections[0]);

            for (let i = collection_names.length - 1; i >= 0; i--) // Iterate backwards
            {
                let collection_name = collection_names[i];
                collection_name = this._fileSanitizer.sanitize(collection_name, '_'); // Convert to file safe string
                path = path + '/' + collection_name;
            }
        }

        if (path !== '') path = path.substring(1);

        return path;
    }

    _getCollectionNamesHierarchy(collection)
    {
        let collectionHierarchy = [];
        let currentCollection = collection;

        for(let i = 0; i < 10; i++)
        {
            collectionHierarchy.push(currentCollection.name);

            if(!currentCollection.parentID) break;

            currentCollection = Zotero.Collections.get(currentCollection.parentID);
        }

        return collectionHierarchy;
    }
}

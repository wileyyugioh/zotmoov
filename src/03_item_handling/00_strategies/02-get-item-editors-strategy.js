var GetItemEditorsStrategy = class extends GetItemCreatorsStrategyInterface {
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
        const editorType = Zotero.CreatorTypes.getID('editor');

        let editors = [];

        for (let i = 0; i < zoteroCreators.length; ++i) {
            const zoteroCreator = zoteroCreators[i];

            if (zoteroCreator.creatorTypeID === editorType) {
                const editor = this._creatorFactory.create(zoteroCreator, CreatorType.EDITOR);
                editors.push(editor);
            }
        }

        return editors;
    }
}

var GetItemTemplatePossibilities = class {
    /**
     * @param item {Item} - The item to process.
     * @returns {TemplatePossibility[]}
     */
    get_template_possibilities(item) {
        return [
            new TemplatePossibility("%a", item.get_concatenated_creators(CreatorType.AUTHOR, CreatorFormattingType.LastName)),
            new TemplatePossibility("%b", item.cite_key),
            new TemplatePossibility("%I", item.get_concatenated_creators(CreatorType.AUTHOR, CreatorFormattingType.Initial).toUpperCase()),
            new TemplatePossibility("%F", item.get_concatenated_creators(CreatorType.AUTHOR, CreatorFormattingType.LastFirst)),
            new TemplatePossibility("%A", item.get_concatenated_creators(CreatorType.AUTHOR, CreatorFormattingType.LastName).toUpperCase()),
            new TemplatePossibility("%d", item.get_concatenated_creators(CreatorType.EDITOR, CreatorFormattingType.LastName)),
            new TemplatePossibility("%D", item.get_concatenated_creators(CreatorType.EDITOR, CreatorFormattingType.LastName).toUpperCase()),
            new TemplatePossibility("%L", item.get_concatenated_creators(CreatorType.EDITOR, CreatorFormattingType.LastFirst)),
            new TemplatePossibility("%l", item.get_concatenated_creators(CreatorType.EDITOR, CreatorFormattingType.Initial)),
            new TemplatePossibility("%y", item.year),
            new TemplatePossibility("%t", item.title_cleaned),
            new TemplatePossibility("%T", item.item_type_localized),
            new TemplatePossibility("%j", item.publication),
            new TemplatePossibility("%p", item.publisher),
            new TemplatePossibility("%w", item.publication !== '' ? item.publication : item.publisher),
            new TemplatePossibility("%s", item.journal_abbreviation),
            new TemplatePossibility("%v", item.volume),
            new TemplatePossibility("%e", item.issue),
            new TemplatePossibility("%f", item.pages),
            new TemplatePossibility("%c", item.collection_paths)
        ];
    }
}


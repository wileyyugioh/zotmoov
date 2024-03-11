class AuthorFormatter {
    constructor(delimiter = '\ ', creatorFactory, maxNumberOfAuthors) {
        this._delimiter = delimiter;
        this._creatorFactory = creatorFactory;
        this._maxNumberOfAuthors = maxNumberOfAuthors;
    }

    _get_all_authors(zoteroCreators, zoteroCreatorTypeIDs) {
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

    _get_all_editors(zoteroCreators, zoteroCreatorTypeIDs, editorType) {
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

    _append_etal_signifier(string) {
        return string + " et al.";
    }

    _get_formatted_creator(creator) {
        let lastName = creator.lastName;
        let creatorLastNameWithFirstInitial = creator.lastName + creator.firstName[0].toUpperCase();
        let creatorInitials = creator.initials;
        let creatorNameFormattedAsLastFirst = `${creator.lastName}, ${creator.firstName}`;

        return [lastName, creatorLastNameWithFirstInitial, creatorInitials, creatorNameFormattedAsLastFirst];
    }

    _get_formatted_authors(authors) {
        const add_etal_signifier = authors.length > this._maxNumberOfAuthors;

        let authorsLastNamesConcatenated = "";
        let authorsLastNameWithFirstInitialConcatenated = "";
        let authorsInitialsConcatenated = "";
        let authorsNameFormattedAsLastFirstConcatenated = "";

        for (let i = 0; i < authors.length; ++i) {
            if (i > this._maxNumberOfAuthors) break;

            const author = authors[i];
            const [lastName, authorLastNameWithFirstInitial, authorInitials, authorNameFormattedAsLastFirst] = this._get_formatted_creator(author);

            authorsLastNamesConcatenated += authorsLastNamesConcatenated ? this._delimiter + lastName : lastName;
            authorsInitialsConcatenated += authorsInitialsConcatenated ? this._delimiter + authorInitials : authorInitials;
            authorsLastNameWithFirstInitialConcatenated += authorsLastNameWithFirstInitialConcatenated ? this._delimiter + authorLastNameWithFirstInitial : authorLastNameWithFirstInitial;
            authorsNameFormattedAsLastFirstConcatenated += authorsNameFormattedAsLastFirstConcatenated ? this._delimiter + authorNameFormattedAsLastFirst : authorNameFormattedAsLastFirst;
        }

        let lastAuthorLastName = "";
        let lastAuthorLastNameWithFirstInitial = "";
        let lastAuthorInitials = "";
        let lastAuthorNameFormattedAsLastFirst = "";

        if (authors.length > 0) {
            [lastAuthorLastName, lastAuthorLastNameWithFirstInitial, lastAuthorInitials, lastAuthorNameFormattedAsLastFirst] = this._get_formatted_creator(authors[authors.length - 1]);
        }

        if (add_etal_signifier) {
            authorsLastNamesConcatenated = this._append_etal_signifier(authorsLastNamesConcatenated);
            authorsLastNameWithFirstInitialConcatenated = this._append_etal_signifier(authorsLastNameWithFirstInitialConcatenated);
            authorsInitialsConcatenated = this._append_etal_signifier(authorsInitialsConcatenated);
            authorsNameFormattedAsLastFirstConcatenated = this._append_etal_signifier(authorsNameFormattedAsLastFirstConcatenated);
        }

        return [
            authorsLastNamesConcatenated,
            authorsLastNameWithFirstInitialConcatenated,
            authorsInitialsConcatenated,
            authorsNameFormattedAsLastFirstConcatenated,
            lastAuthorLastName,
            lastAuthorLastNameWithFirstInitial,
            lastAuthorInitials,
            lastAuthorNameFormattedAsLastFirst
        ];
    }

    _get_formatted_editors(editors) {
        const add_etal_signifier = editors.length > this._maxNumberOfAuthors;

        let editorsLastNamesConcatenated = "";
        let editorsLastNameWithFirstInitialConcatenated = "";
        let editorsInitialsConcatenated = "";
        let editorsNameFormattedAsLastFirstConcatenated = "";

        for (let i = 0; i < editors.length; ++i) {
            if (i > this._maxNumberOfAuthors) break;

            const editor = editors[i];
            const [lastName, editorLastNameWithFirstInitial, editorInitials, editorNameFormattedAsLastFirst] = this._get_formatted_creator(editor);

            editorsLastNamesConcatenated += editorsLastNamesConcatenated ? this._delimiter + lastName : lastName;
            editorsInitialsConcatenated += editorsInitialsConcatenated ? this._delimiter + editorInitials : editorInitials;
            editorsLastNameWithFirstInitialConcatenated += editorsLastNameWithFirstInitialConcatenated ? this._delimiter + editorLastNameWithFirstInitial : editorLastNameWithFirstInitial;
            editorsNameFormattedAsLastFirstConcatenated += editorsNameFormattedAsLastFirstConcatenated ? this._delimiter + editorNameFormattedAsLastFirst : editorNameFormattedAsLastFirst;
        }

        if (add_etal_signifier) {
            editorsLastNamesConcatenated = this._append_etal_signifier(editorsLastNamesConcatenated);
            editorsLastNameWithFirstInitialConcatenated = this._append_etal_signifier(editorsLastNameWithFirstInitialConcatenated);
            editorsInitialsConcatenated = this._append_etal_signifier(editorsInitialsConcatenated);
            editorsNameFormattedAsLastFirstConcatenated = this._append_etal_signifier(editorsNameFormattedAsLastFirstConcatenated);
        }

        return [
            editorsLastNamesConcatenated,
            editorsLastNameWithFirstInitialConcatenated,
            editorsInitialsConcatenated,
            editorsNameFormattedAsLastFirstConcatenated
        ];
    }

    format(zoteroItem) {
        // Zotero declarations
        const zoteroCreators = zoteroItem.getCreators();
        const zoteroCreatorTypeIDs = [Zotero.CreatorTypes.getPrimaryIDForType(zoteroItem.itemTypeID)];
        const editorType = Zotero.CreatorTypes.getID('editor');

        const authors = this._get_all_authors(zoteroCreators, zoteroCreatorTypeIDs);
        const editors = this._get_all_editors(zoteroCreators, zoteroCreatorTypeIDs, editorType);

        const formattedAuthors = this._get_formatted_authors(authors);
        const formattedEditors = this._get_formatted_editors(editors);

        return [formattedAuthors, formattedEditors];
    }
}



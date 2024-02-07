
Zotero.ZotMoov.Wildcard = {
    // Some of this code is modfied from https://github.com/jlegewie/zotfile/blob/e0c1fa1d3d92716bdec56fddd6e07f563a535d95/chrome/content/zotfile/wildcards.js

    function _format_authors(item) {
        // get creator and create authors string
        var itemType = Zotero.ItemTypes.getName(item.itemTypeID);
        var creatorTypeIDs  = [Zotero.CreatorTypes.getPrimaryIDForType(item.itemTypeID)];
        var add_etal = true;
        var author = "", author_lastf="", author_initials="", author_lastg = "";
        var creators = item.getCreators();
        var numauthors = creators.length;
        for (var i = 0; i < creators.length; ++i) {
            if (creatorTypeIDs.indexOf(creators[i].creatorTypeID) === -1) numauthors=numauthors-1;
        }
        var max_authors = 5; // Hard coded lol
        if (numauthors <= max_authors) add_etal = false;
        else numauthors = max_authors;
        var delimiter = '\ ';
        var j = 0;
        for (i = 0; i < creators.length; ++i) {
            if (j < numauthors && creatorTypeIDs.indexOf(creators[i].creatorTypeID) != -1) {
                if (author !== "") author += delimiter + creators[i].lastName;
                if (author === "") author = creators[i].lastName;
                var lastf =  creators[i].lastName + creators[i].firstName.substr(0, 1).toUpperCase();
                if (author_lastf !== "") author_lastf += delimiter + lastf;
                if (author_lastf === "") author_lastf = lastf;
                var initials = creators[i].firstName.substr(0, 1).toUpperCase() + creators[i].lastName.substr(0, 1).toUpperCase()
                if (author_initials !== "") author_initials += delimiter + initials;
                if (author_initials === "") author_initials = initials;
        var lastg = creators[i].lastName + ", " + creators[i].firstName;
                if (author_lastg !== "") author_lastg += delimiter + lastg;
                if (author_lastg === "") author_lastg = lastg;
                j=j+1;
            }
        }
        if (add_etal) {
            author = author + 'et al';
            author_lastf = author_lastf + 'et al';
            author_initials = author_initials + 'et al';
            author_lastg = author_lastg + 'et al';
        }
        //create last (senior) author string
        var lastAuthor = "", lastAuthor_lastf= "", lastAuthor_initials= "", lastAuthor_lastInitial = "";
        if (creators.length > 0) {
            lastAuthor = creators[creators.length - 1].lastName;
            lastAuthor_lastf = creators[creators.length - 1].lastName + creators[creators.length - 1].firstName.substr(0, 1).toUpperCase();
            lastAuthor_initials = creators[creators.length - 1].firstName.substr(0, 1).toUpperCase() + creators[creators.length - 1].lastName.substr(0, 1).toUpperCase();
            lastAuthor_lastInitial = creators[creators.length - 1].lastName.substr(0, 1).toUpperCase();
        }
        // get creator and create editors string
        var editorType = [Zotero.CreatorTypes.getID('editor')];
        var editor = "", editor_lastf="", editor_initials="";
        var numeditors = creators.length;
        for (var i = 0; i < creators.length; ++i) {
            if (editorType.indexOf(creators[i].creatorTypeID) === -1) numeditors=numeditors-1;
        }
        if (numeditors <= max_authors) add_etal = false;
        else numeditors = max_authors;
        var j = 0;
        for (i = 0; i < creators.length; ++i) {
            if (j < numeditors && editorType.indexOf(creators[i].creatorTypeID) != -1) {
                if (editor !== "") editor += delimiter + creators[i].lastName;
                if (editor === "") editor = creators[i].lastName;
                var lastf =  creators[i].lastName + creators[i].firstName.substr(0, 1).toUpperCase();
                if (editor_lastf !== "") editor_lastf += delimiter + lastf;
                if (editor_lastf === "") editor_lastf = lastf;
                var initials = creators[i].firstName.substr(0, 1).toUpperCase() + creators[i].lastName.substr(0, 1).toUpperCase()
                if (editor_initials !== "") editor_initials += delimiter + initials;
                if (editor_initials === "") editor_initials = initials;
                j=j+1;
            }
        }
        return([author, author_lastf, author_initials, editor, editor_lastf, editor_initials, author_lastg, lastAuthor, lastAuthor_lastInitial, lastAuthor_lastf, lastAuthor_initials]);
    },

    function _truncateTitle(title) {
        title = '' + title

        // truncate title after : . and ?
        if(Zotero.ZotFile.getPref("truncate_title")) {
            var truncate = title.search(/:|\.|\?|\!/);
            if(truncate!=-1) title = title.substr(0,truncate);
        }

        // truncate if to long
        if (title.length > Zotero.ZotFile.getPref("max_titlelength")) {
            var max_titlelength=Zotero.ZotFile.getPref("max_titlelength");
            var before_trunc_char = title.substr(max_titlelength,1);

            // truncate title at max length
            title = title.substr(0,max_titlelength);

            // remove the last word until a space is found
            if(Zotero.ZotFile.getPref("truncate_smart") && title.search(" ")!=-1 && before_trunc_char.search(/[a-zA-Z0-9]/!=-1)) {
                while (title.substring(title.length-1, title.length) != ' ') title = title.substring(0, title.length-1);
                title = title.substring(0, title.length-1);
            }
        } else {
            // remove some non letter characters if they apear at the end of the title that was not truncated
            var endchar = title.substring(title.length-1, title.length);
            if (endchar == ':' || endchar == '?' || endchar == '.' || endchar == '/' || endchar == '\\' || endchar == '>' || endchar == '<' || endchar == '*' || endchar == '|') {
                title = title.substring(0, title.length-1);
            }
        }

        // replace forbidden characters with meaningful alternatives (they can only apear in the middle of the text at this point)
        title = title.replace(/[\/\\]/g, '-');
        title = title.replace(/[\*|"<>]/g, '');
        title = title.replace(/[\?:]/g, ' -');
        return title;
    }

    function _get_collection_paths(item)
    {
        // Get parent collection if parent is present
        let collection_ids = item.parentID ? item.parentItem.getCollections() : item.getCollections();

        let path = ''
        if(collection_ids.length)
        {
            let collections = Zotero.Collections.get(collection_ids);
            let collection_names = this._getCollectionNamesHierarchy(collections[0]);

            for (let i = collection_names.length - 1; i >= 0; i--) // Iterate backwards
            {
                let collection_name = collection_names[i];
                collection_name = Zotero.ZotMoov.Sanitize.sanitize(collection_name, '_'); // Convert to file safe string
                path = PathUtils.join(path, collection_name);
            }
        }

        return path;
    },

    function _get_fields(item)
    {
        let item_type = item.itemTypeID;
        let item_type_name = Zotero.ItemTypes.getName(item_type);
        // get formated author strings
        let authors = _format_authors(item);

        let _item_fields =
        {
                'itemTypeEN': Zotero.ItemTypes.getName(item_type),
                'itemType': Zotero.ItemTypes.getLocalizedString(item_type),
                'titleFormated': _truncateTitle(item.getField("title", false, true)),
                'author': authors[0],
                'authorLastF': authors[1],
                'authorInitials': authors[2],
                'editor': authors[3],
                'editorLastF': authors[4],
                'editorInitials': authors[5],
                'authorLastG': authors[6],
                "lastAuthor": authors[7],
                "lastAuthor_lastInitial": authors[8],
                "lastAuthor_lastf": authors[9],
                "lastAuthor_initials": authors[10],
                "collectionPaths": _get_collection_paths(item),
                "citekey": Zotero.BetterBibTeX ? item.getField('citationKey') : undefined,
                'year': Zotero.Date.strToDate(item.getField('date', false, true)).year,
                'journalAbbrev': item.getField('journalAbbreviation', false, true)
        }

        return _item_fields
    },

    function process_string(item, string)
    {
        const bracket_reg = /\{([^\}]+)\}/g;
        const sub_brackets = string.match(bracket_reg);
    },

    function _process_wildcard(item, wildcard)
    {
        let optional_flag = wildcard.startsWith('{-')
        let strip_between_or = wildcard.replaceAll( /(%[a-z]|\|)([^%\|\}]*)/g, '$1');
        let sub_strings = strip_between_or.split(/(%[a-z]|\|)/);

        let item_fields = _get_fields(item);

        let processed_array = [];
        let subbed_a_wildcard = false;
        substr_iterate: for (const sub of sub_strings)
        {
            let result = sub;
            switch(sub)
            {
                case '|':
                    if (subbed_a_wildcard)
                    {
                        processed_array.push('}');
                        break substr_iterate;
                    }
                    result = '';
                    break;
                case '%a':
                    result = item_fields['author'];
                    break;
                case '%b':
                    result = item_fields['citekey'];
                    break;
                case 'I':
                    result = item_fields['authorInitials'];
                    break;
                case 'F':
                    result = item_fields['authorLastF'];
                    break;
                case '%A':
                    result = item_fields['author'][0];
                    break;
                case '%y':
                    result = item_fields['year'];
                    break;
                case '%t':
                    result = item_fields['titleFormated'];
                    break;
                case '%T':
                    result = item_fields['itemType'];
                    break;
                case '%s':
                    result = item_fields['journalAbbrev'];
                    break;

                default:
            }

            if (result != sub && result != '')
            {
                subbed_a_wildcard = true;
            }

            processed_array.push(result);
        }
        final_result = processed_array.join('')
        final_result = final_result.slice(optional_flag ? 2 : 1, -1);
    }
}
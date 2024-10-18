Components.utils.importGlobalProperties(['PathUtils']);

var ZotMoovWildcard = class {
    // Some of this code is modfied from https://github.com/jlegewie/zotfile/blob/e0c1fa1d3d92716bdec56fddd6e07f563a535d95/chrome/content/zotfile/wildcards.js

    constructor(sanitizer, custom_wc) {
        this.sanitizer = sanitizer;
        this.custom_wc_parser = custom_wc;
    }

    _format_authors(item) {
        // get creator and create authors string
        var itemType = Zotero.ItemTypes.getName(item.itemTypeID);
        var creatorTypeIDs  = [Zotero.CreatorTypes.getPrimaryIDForType(item.itemTypeID)];
        var add_etal = false;
        var author = "", author_lastf="", author_initials="", author_lastg = "";
        var creators = item.getCreators();
        var numauthors = creators.length;
        for (var i = 0; i < creators.length; ++i) {
            if (creatorTypeIDs.indexOf(creators[i].creatorTypeID) === -1) numauthors=numauthors-1;
        }
        var max_authors = 1; // Hard coded lol
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
            author = author + ' et al';
            author_lastf = author_lastf + ' et al';
            author_initials = author_initials + ' et al';
            author_lastg = author_lastg + ' et al';
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
    }

    _truncateTitle(title) {
        let custom_max_titlelength = 200;
        title = '' + title

        var truncate = title.search(/:|\.|\?|\!/);
        if(truncate!=-1) title = title.substr(0,truncate);

        // truncate if to long
        if (title.length > custom_max_titlelength) {
            var max_titlelength=custom_max_titlelength;
            var before_trunc_char = title.substr(max_titlelength,1);

            // truncate title at max length
            title = title.substr(0,max_titlelength);

            // remove the last word until a space is found
            if(title.search(" ")!=-1 && before_trunc_char.search(/[a-zA-Z0-9]/!=-1)) {
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

    _get_collection_paths(item, preferred_collection = null)
    {
        // Get parent collection if parent is present
        let collection_ids = item.parentID ? item.parentItem.getCollections() : item.getCollections();

        let path = ''
        if(collection_ids.length)
        {
            let collections = Zotero.Collections.get(collection_ids);
            let collection_index = collections.findIndex((c) => c.id == preferred_collection);
            if (collection_index == -1) collection_index = 0;

            let collection_names = this._getCollectionNamesHierarchy(collections[collection_index]);

            for (let i = collection_names.length - 1; i >= 0; i--) // Iterate backwards
            {
                let collection_name = collection_names[i];
                collection_name = this.sanitizer.sanitize(collection_name, '_'); // Convert to file safe string
                path = path + '/' + collection_name;
            }
        }

        if (path != '') path = path.substring(1);

        return path;
    }

    _getCollectionNamesHierarchy(collection)
    {
        let r = [];
        let loc_collection = collection;
        for(let i = 0; i < 10; i++) // Timeout after 10 directories
        {
            r.push(loc_collection.name);
            if(!loc_collection.parentID) break;
            loc_collection = Zotero.Collections.get(loc_collection.parentID);
        }

        return r;
    }

    _get_fields(item, arg_options = {})
    {
        const default_options = {
            preferred_collection: null
        };
        let options = {...default_options, ...arg_options};

        let item_type = item.itemTypeID;
        let item_type_name = Zotero.ItemTypes.getName(item_type);
        // get formated author strings
        let authors = this._format_authors(item);

        let _item_fields =
            {
                'itemTypeEN': Zotero.ItemTypes.getName(item_type),
                'itemType': Zotero.ItemTypes.getLocalizedString(item_type),
                'titleFormated': this._truncateTitle(item.getField("title", false, true)),
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
                "collectionPaths": this._get_collection_paths(item, options.preferred_collection),
                "citekey": Zotero.BetterBibTeX ? item.getField('citationKey') : '',
                'year': item.getField('year', false, true),
                'journalAbbrev': item.getField('journalAbbreviation', false, true),
                'publication': item.getField('publicationTitle', false, true),
                'publisher': item.getField('publisher', false, true),
                'volume': item.getField('volume', false, true),
                'issue': item.getField('issue', false, true),
                'pages': item.getField('pages', false, true),
                'dateAdded': new Date(item.dateAdded + 'Z'),
                'date': Zotero.Date.strToDate(item.getField('date', false, true))
            };

        return _item_fields
    }

    _sub(item, item_fields, wildcard, undefined_str = 'undefined', custom_wc = {})
    {
        let result = wildcard;

        const cw = (new this.custom_wc_parser(custom_wc)).apply(wildcard, item);
        if(cw) return cw;

        switch(wildcard)
        {
            case '%a':
                result = item_fields['author'];
                break;
            case '%b':
                result = item_fields['citekey'];
                break;
            case '%I':
                result = item_fields['authorInitials'];
                result = result.toUpperCase();
                break;
            case '%F':
                result = item_fields['authorLastF'];
                break;
            case '%A':
                result = (item_fields['author'] == '') ? '' : item_fields['author'][0];
                result = result.toUpperCase();
                break;
            case '%d':
                result = item_fields['editor'];
                break;
            case '%D':
                result = (item_fields['editor'] == '') ? '' : item_fields['editor'][0];
                result = result.toUpperCase();
                break;
            case '%L':
                result = item_fields['editorLastF'];
                break;
            case '%l':
                result = item_fields['editorInitials'];
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
            case '%j':
                result = item_fields['publication'];
                break;
            case '%p':
                result = item_fields['publisher'];
                break;
            case '%w':
                result = item_fields['publication']
                if (result == '') result = item_fields['publisher'];
                break;
            case '%s':
                result = item_fields['journalAbbrev'];
                break;
            case '%v':
                result = item_fields['volume'];
                break;
            case '%e':
                result = item_fields['issue'];
                break;
            case '%f':
                result = item_fields['pages'];
                break;
            case '%c':
                result = item_fields['collectionPaths']
                break;
            case '%Y':
                result = String(item_fields['dateAdded'].getFullYear());
                break;
            case '%m':
                result = (item_fields['date'].month != null) ? String(item_fields['date'].month + 1).padStart(2, '0') : '';
                break;
            case '%r':
                result = (item_fields['date'].day != null) ? String(item_fields['date'].day).padStart(2, '0') : '';
                break;
            case '%M':
                result = String(item_fields['dateAdded'].getMonth() + 1).padStart(2, '0');
                break;
            case '%R':
                result = String(item_fields['dateAdded'].getDate()).padStart(2, '0');
                break;
            case '%U':
                result = undefined_str;
                break;

            default:
                break;
        }

        return result;
    }

    process_string(item, string, arg_options = {})
    {
        const default_options = {
            preferred_collection: null,
            undefined_str: 'undefined',
            custom_wc: {}
        };
        let options = {...default_options, ...arg_options};

        let sub_brackets = [];
        let open_br = 0;
        let start_br = 0;
        for (let i = 0; i < string.length; i++)
        {
            if (string[i] == '{')
            {
                if(open_br == 0) start_br = i;
                open_br++;
            } else if (string[i] == '}')
            {
                if(open_br == 1) sub_brackets.push(string.substring(start_br, i + 1));
                open_br--;
            }
        }

        if (item.isAttachment() && item.parentItem) item = item.parentItem;

        let item_fields = this._get_fields(item, { preferred_collection: options.preferred_collection });
        const sub_strs = sub_brackets.map((bracket) => this._process_wildcard(item, item_fields, bracket.slice(1, -1),
            { undefined_str: options.undefined_str, custom_wc: options.custom_wc }));

        for (let i = 0; i < sub_brackets.length; i++)
        {
            string = string.replace(sub_brackets[i], sub_strs[i]);
        }

        string = string.replaceAll(/%[a-zA-Z1-9]/g, (match) =>
        {
            return this._sub(item, item_fields, match, options.undefined_str, options.custom_wc);
        });

        return string
    }

    _process_wildcard(item, item_fields, wildcard, arg_options = {})
    {
        const default_options = {
            undefined_str: 'undefined',
            custom_wc: {}
        };
        let options = {...default_options, ...arg_options};

        let preprocess = wildcard.replaceAll(/(%[a-zA-Z])([^\|]*)\|/g, '$1|');
        preprocess = preprocess.replaceAll(/\|([^%]*)(%[a-zA-Z])/g, '|$2');
        let sub_strings = preprocess.split(/(%[a-zA-Z]|\|)/);

        let processed_array = [];
        let subbed_a_wildcard = false;
        let optional_processing = sub_strings.includes('|')
        for (const sub of sub_strings)
        {
            if (optional_processing && subbed_a_wildcard && sub[0] == '%') continue;
            let result = this._sub(item, item_fields, sub, options.undefined_str, options.custom_wc);
            if (result == '|') result = '';
            if (sub[0] == '%' && result != '') subbed_a_wildcard = true;
            if (!optional_processing && sub[0] == '%' && result == '') return ''; // Failed to sub

            processed_array.push(result);
        }

        if (!subbed_a_wildcard) return '';
        return processed_array.join('');
    }

    _test(item)
    {
        const str_to_test = '{%a}/{%b | %I}/{%Y}{-%M}{-%R}/{%F}/{%A}/{%d}/{%D}/{%L}/{%l}/{%y}/{%t}/{%T}/{%j}/{%p}/{%w}/{%s}/{%v}/{%e}/{%f}/{%c}/{%y}{-%m}{-%r}/';
        return this.process_string(item, str_to_test);
    }
}

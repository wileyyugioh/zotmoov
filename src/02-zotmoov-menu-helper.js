var ZotMoovMenuHelper = class
{
    constructor(zotmoov, bindings)
    {
        this._zotmoov = zotmoov;
        this._zotmoov_bindings = bindings;
    }

    getSelectedNotes()
    {
        // Get the selected notes
        let notes = new Set();
        let items = Zotero.getActiveZoteroPane().getSelectedItems();
        let note_ids = [];
        for (let item of items)
        {
            if (item.isNote())
            {
                notes.add(item);
                continue;
            }

            note_ids.push(...item.getNotes());
        }

        let new_notes = Zotero.Items.get(note_ids);
        new_notes.forEach(note => notes.add(note));

        return notes;
    }

    async fixNoteLinks()
    {
        let notes = this.getSelectedNotes();
        for (let note of notes)
        {
            let doc = (new DOMParser()).parseFromString(note.getNote(), 'text/html');
            let citations = doc.querySelectorAll('span[data-annotation] + span[data-citation]');
            for (let citation of citations)
            {
                let dc = citation.getAttribute('data-citation');
                dc = JSON.parse(decodeURIComponent(dc));

                let cis = dc.citationItems
                if (!cis) continue;

                let uris = cis[0].uris;
                if (!uris) continue;

                let item = await Zotero.EditorInstance.getItemFromURIs(uris);
                if (!item) continue;


                let att = await item.getBestAttachment();
                if (!att) continue;

                let highlight = citation.previousElementSibling;
                let da = highlight.getAttribute('data-annotation');
                da = JSON.parse(decodeURIComponent(da));

                let old_uri = da.attachmentURI;
                if (!old_uri) continue;

                let obj = Zotero.URI._getURIObject(old_uri);
                if (!obj) continue;

                let old_key = obj.key;
                let new_key = att.key;

                // Make sure old object is really gone
                if (Zotero.Items.getIDFromLibraryAndKey(obj.libraryID, obj.key)) continue;

                Zotero.Notes.replaceItemKey(note, old_key, new_key);
                await note.saveTx();
            }
        }
    }

    async importLastModifiedFile()
    {
        const should_move = Zotero.Prefs.get('extensions.zotmoov.file_behavior', true) == 'move';
        const search_dir = Zotero.Prefs.get('extensions.zotmoov.attach_search_dir', true);

        const rename_title = Zotero.Prefs.get('extensions.zotmoov.rename_title', true);
        let allowed_file_ext = JSON.parse(Zotero.Prefs.get('extensions.zotmoov.allowed_fileext', true));
        // Pass null if empty
        allowed_file_ext = (allowed_file_ext.length) ? allowed_file_ext.map(ext => ext.toLowerCase()) : null;

        let items = Zotero.getActiveZoteroPane().getSelectedItems();
        if (items.length != 1 || !items[0].isRegularItem()) return; // Only run if only one file is selected
        if (!search_dir) return;

        let lastFilePath = null;
        let lastDate = new Date(0);
        let children = await IOUtils.getChildren(search_dir);
        for(const path of children)
        {
            const { lastModified, type } = await IOUtils.stat(path);
            const filename = PathUtils.filename(path);

            if(type != 'regular') continue;
            if(['.DS_Store', 'Thumbs.db', 'desktop.ini'].includes(filename)) continue;

            // Ignore invalid file extensions
            if (Array.isArray(allowed_file_ext))
            {
                const file_ext = Zotero.File.getExtension(path).toLowerCase();
                if (!allowed_file_ext.includes(file_ext)) continue;
            }

            let lastModifiedDate = new Date(lastModified);
            if(lastModifiedDate > lastDate)
            {
                lastDate = lastModifiedDate;
                lastFilePath = path;
            }
        }

        if(!lastFilePath) return;

        let fileBaseName = false;
        if (Zotero.Attachments.shouldAutoRenameFile() && rename_title)
        {
            fileBaseName = await Zotero.Attachments.getRenamedFileBaseNameIfAllowedType(items[0], lastFilePath);
        }

        if (Zotero.Prefs.get('extensions.zotmoov.attach_prompt', true))
        {
            let file_ext = Zotero.File.getExtension(lastFilePath);
            if (file_ext) file_ext = '.' + file_ext;
            let orig_filename = PathUtils.filename(lastFilePath);
            orig_filename = orig_filename.substring(0, orig_filename.length - file_ext.length);

            const new_filename = await new Promise((resolve, reject) =>
            {
                Zotero.getMainWindow().openDialog('chrome://zotmoov/content/add-att-confirm.xhtml',
                'zotmoov-add-att-dialog-window',
                'chrome,centerscreen,resizable=no,modal',
                {
                    orig_filename: orig_filename,
                    new_filename: fileBaseName || orig_filename,
                    callback: resolve
                });
            });

            if (!new_filename) return;
            fileBaseName = new_filename;
        }

        const options = {
            'file': lastFilePath,
            'fileBaseName': fileBaseName,
            'parentItemID': items[0].id,
            'libraryID': items[0].libraryID,
        };

        let att = null;
        await this._zotmoov_bindings.lock(async () =>
        {
            att = await Zotero.Attachments.importFromFile(options);
            this._zotmoov_bindings.ignoreAdd([att.key]);
        });

        if (att.getFilePath() != lastFilePath) await IOUtils.remove(lastFilePath);

        let dst_path = Zotero.Prefs.get('extensions.zotmoov.dst_dir', true);

        let pref = this._zotmoov.getBasePrefs();
        pref.rename_file = false;

        if(should_move)
        {
            await this._zotmoov.move([att], dst_path, pref);
        } else
        {
            await this._zotmoov.copy([att], dst_path, pref);
        }
    }
}
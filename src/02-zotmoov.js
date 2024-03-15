Components.utils.importGlobalProperties(['PathUtils', 'IOUtils']);

class ZotMoov {
    constructor(id, version, wildcard, sanitizer, zotmoov_debugger) {
        this.id = id;
        this.version = version;
        this._notifierID = Zotero.Notifier.registerObserver(new ZotmoovNotifyCallback(this), ['item'], 'zotmoov', 99);
        this._enabled = true;

        this.wildcard = wildcard;
        this.sanitizer = sanitizer;
        this.zotmoov_debugger = zotmoov_debugger;

        this._origConvertLinked = Zotero.Attachments.convertLinkedFileToStoredFile;
        Zotero.Attachments.convertLinkedFileToStoredFile = this._convertLinkedFileToStoredFile;
    }

    destroy() {
        Zotero.Notifier.unregisterObserver(this._notifierID);
        Zotero.Attachments.convertLinkedFileToStoredFile = this._origConvertLinked;
    }

    enable() { this._enabled = true;}

    disable() { this._enabled = false;}

    async _convertLinkedFileToStoredFile(item, options = {})
    {
        this.disable();
        await Zotero.ZotMoov._origConvertLinked.bind(Zotero.Attachments)(item, options);
        this.enable();
    }

    _getCopyPath(item, dst_path, into_subfolder, subdir_str)
    {
        let file_path = item.getFilePath();
        let file_name = file_path.split(/[\\/]/).pop();
        let local_dst_path = dst_path;

        // Optionally add subdirectory folder here
        if (into_subfolder)
        {
            let custom_dir = this.wildcard.process_string(item, subdir_str);
            let sanitized_custom_dir = custom_dir.split('/').map((dir) => this.sanitizer.sanitize(dir, '_'));
            local_dst_path = PathUtils.join(local_dst_path, ...sanitized_custom_dir);
        }

        let copy_path = PathUtils.join(local_dst_path, file_name);

        return copy_path;
    }

    async move(items, dst_path, arg_options = {})
    {
        const default_options = {
            ignore_linked: true,
            into_subfolder: false,
            subdir_str: '',
            allowed_file_ext: null,
        };

        let options = {...default_options, ...arg_options};

        // Convert to lowercase to ensure case insensitive
        if (Array.isArray(options.allowed_file_ext))
        {
            options.allowed_file_ext = options.allowed_file_ext.map(ext => ext.toLowerCase());
        }

        if (dst_path == '') return;

        let promises = [];
        for (let item of items)
        {
            if (!item.isFileAttachment()) continue;
            if (item.libraryID != Zotero.Libraries.userLibraryID) continue;

            if (options.ignore_linked)
            {
                if (item.attachmentLinkMode != Zotero.Attachments.LINK_MODE_IMPORTED_FILE &&
                    item.attachmentLinkMode != Zotero.Attachments.LINK_MODE_IMPORTED_URL) continue;
            }

            let file_path = item.getFilePath();

            // Test to see if file extension is allowed
            if (Array.isArray(options.allowed_file_ext))
            {
                let file_ext = file_path.split('.').pop().toLowerCase();
                if (!options.allowed_file_ext.includes(file_ext)) continue;
            }

            let copy_path = this._getCopyPath(item, dst_path, options.into_subfolder, options.subdir_str);

            // Have to check since later adding an entry triggers the
            // handler again
            if (file_path == copy_path) continue;

            let final_path = copy_path;
            let path_arr = final_path.split('.');
            let file_ext = path_arr.pop();
            let rest_of_path = path_arr.join('.');

            let i = 1;
            while(await IOUtils.exists(final_path)) final_path = rest_of_path + ' ' + (i++) + '.' + file_ext;

            let clone = item.clone(null, { includeCollections: true });
            clone.attachmentLinkMode = Zotero.Attachments.LINK_MODE_LINKED_FILE;
            clone.attachmentPath = final_path;
            clone.setField('title', PathUtils.filename(final_path));

            promises.push(IOUtils.move(file_path, final_path, { noOverwrite: true }).then(function(clone, item)
                {
                    clone.saveTx().then(async function(id)
                    {
                        await Zotero.DB.executeTransaction(async function()
                        {
                            await Zotero.Items.moveChildItems(item, clone);
                        });
                        Zotero.Fulltext.indexItems(id);// reindex clone after saved
                        item.eraseTx(); // delete original item
                    });
                }.bind(null, clone, item))
            );
        }

        return Promise.allSettled(promises);
    }

    async copy(items, dst_path, arg_options = {})
    {
        const default_options = {
            into_subfolder: false,
            subdir_str: '',
            allow_group_libraries: false,
            allowed_file_ext: null,
        };

        let options = {...default_options, ...arg_options};

        // Convert to lowercase to ensure case insensitive
        if (Array.isArray(options.allowed_file_ext))
        {
            options.allowed_file_ext = options.allowed_file_ext.map(ext => ext.toLowerCase());
        }

        if (dst_path == '') return;

        let promises = [];
        for (let item of items)
        {
            if (!item.isFileAttachment()) continue;
            if (!options.allow_group_libraries && item.libraryID != Zotero.Libraries.userLibraryID) continue;

            let file_path = item.getFilePath();

            // Test to see if file extension is allowed
            if (Array.isArray(options.allowed_file_ext))
            {
                let file_ext = file_path.split('.').pop().toLowerCase();
                if (!options.allowed_file_ext.includes(file_ext)) continue;
            }

            let copy_path = Zotero.ZotMoov._getCopyPath(item, dst_path, options.into_subfolder, options.subdir_str);

            if (file_path == copy_path) continue;

            let final_path = copy_path;
            let path_arr = final_path.split('.');
            let file_ext = path_arr.pop();
            let rest_of_path = path_arr.join('.');

            let i = 1;
            while(await IOUtils.exists(final_path)) final_path = rest_of_path + ' ' + (i++) + '.' + file_ext;

            promises.push(IOUtils.copy(file_path, final_path, { noOverwrite: true }));
        }

        return Promise.allSettled(promises);
    }

    _getSelectedItems()
    {
        let items = Zotero.getActiveZoteroPane().getSelectedItems();
        let att_ids = [];
        let atts = new Set();
        for (let item of items)
        {
            if (item.isAttachment())
            {
                atts.add(item);
                continue;
            }

            att_ids.push(...item.getAttachments());
        }

        let new_atts = Zotero.Items.get(att_ids);
        new_atts.forEach(att => atts.add(att));

        return atts
    }

    async moveSelectedItems()
    {
        let atts = this._getSelectedItems();
        let dst_path = Zotero.Prefs.get('extensions.zotmoov.dst_dir', true);
        let subfolder_enabled = Zotero.Prefs.get('extensions.zotmoov.enable_subdir_move', true);
        let subdir_str = Zotero.Prefs.get('extensions.zotmoov.subdirectory_string', true);

        if(Zotero.Prefs.get('extensions.zotmoov.file_behavior', true) == 'move')
        {
            await this.move(atts, dst_path, { ignore_linked: false, into_subfolder: subfolder_enabled, subdir_str: subdir_str });
        } else
        {
            await this.copy(atts, dst_path, { into_subfolder: subfolder_enabled, subdir_str: subdir_str,
                allow_group_libraries: true });
        }
    }

    async moveSelectedItemsCustomDir()
    {
        let atts = this._getSelectedItems();

        let fp = Components.classes['@mozilla.org/filepicker;1'].createInstance(Components.interfaces.nsIFilePicker);
        let wm = Services.wm;
        let win = wm.getMostRecentWindow('navigator:browser');

        fp.init(win, Zotero.getString('dataDir.selectDir'), fp.modeGetFolder);
        fp.appendFilters(fp.filterAll);
        let rv = await new Zotero.Promise(function(resolve)
        {
            fp.open((returnConstant) => resolve(returnConstant));
        });
        if (rv != fp.returnOK) return '';

        if(Zotero.Prefs.get('extensions.zotmoov.file_behavior', true) == 'move')
        {
            await this.move(atts, fp.file.path, { ignore_linked: false, into_subfolder: false });
        } else
        {
            await this.copy(atts, fp.file.path, { into_subfolder: false, allow_group_libraries: true });
        }
    }
}



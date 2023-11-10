// ZotMoov
// zotmoov.js
// Written by Wiley Yu


// If this doesn't load, fail anyways
Components.utils.importGlobalProperties(['PathUtils', 'IOUtils']);

Zotero.ZotMoov =
{
    id: null,
    version: null,
    rootURI: null,
    initialized: false,

    _notifierID: null,

    init({ id, version, rootURI })
    {
        if(this.initialized) return;

        this.id = id;
        this.version = version;
        this.rootURI = rootURI;
        this.initialized = true;
        this._notifierID = Zotero.Notifier.registerObserver(this.notifyCallback, ['item'], 'zotmoov', 99);
    },

    destroy()
    {
        Zotero.Notifier.unregisterObserver(this._notifierID);
    },

    async move(items, dst_path, arg_options = {})
    {
        const default_options = {
            ignore_linked: true,
            into_subfolder: false
        };

        let options = {...default_options, ...arg_options};


        if (dst_path == '') return;

        let promises = [];
        for (let item of items)
        {
            if (item.isRegularItem()) continue;
            if (options.ignore_linked)
            {
                if (!(item.attachmentLinkMode == Zotero.Attachments.LINK_MODE_IMPORTED_FILE ||
                      item.attachmentLinkMode == Zotero.Attachments.LINK_MODE_IMPORTED_URL)) continue;
            }

            let file_path = item.getFilePath();
            let file_name = file_path.split(/[\\/]/).pop();
            let local_dst_path = dst_path;

            // Optionally add subdirectory folder here
            if (options.into_subfolder)
            {
                // Get parent collection if parent is present
                let collection_ids = item.parentID ? item.parentItem.getCollections() : item.getCollections()

                if(collection_ids.length)
                {
                    let collections = Zotero.Collections.get(collection_ids);
                    let collection_name = collections[0].name; // Just use the first collection that comes up
                    collection_name = collection_name.replace(/[^a-z0-9]/gi, '_'); // convert to file safe string

                    local_dst_path = PathUtils.join(local_dst_path, collection_name);
                }
            }

            let copy_path = PathUtils.join(local_dst_path, file_name);

            // Have to check since later adding an entry triggers the
            // handler again
            if (file_path == copy_path) continue;

            let clone = null;
            if (options.ignore_linked)
            {
                // If dragged and dropped from 
                item.attachmentLinkMode = Zotero.Attachments.LINK_MODE_LINKED_FILE;
                item.attachmentPath = copy_path;
            } else 
            {
                // If later transfered via menus/etc.
                clone = item.clone(null, {includeCollections: true})
                clone.attachmentLinkMode = Zotero.Attachments.LINK_MODE_LINKED_FILE;
                clone.attachmentPath = copy_path;

                item.deleted = true;
            }

            // Just overwrite the file if it exists
            promises.push(IOUtils.move(file_path, copy_path).then(function(clone, item)
                {
                    if(clone) clone.saveTx();
                    item.saveTx(); // Only save after copied
                }.bind(null, clone, item))
            );
        }

        return Promise.all(promises)
    },

    _getSelectedItems()
    {
        let items = Zotero.getActiveZoteroPane().getSelectedItems();
        let att_ids = [];
        let atts = new Set();
        for (let item of items)
        {
            if (!item.isRegularItem())
            {
                atts.add(item);
                continue;
            }

            att_ids.push(...item.getAttachments());
        }

        let new_atts = Zotero.Items.get(att_ids);
        new_atts.forEach(att => atts.add(att));

        return atts
    },

    async moveSelectedItems()
    {
        let atts = this._getSelectedItems();
        let dst_path = Zotero.Prefs.get('extensions.zotmoov.dst_dir', true);
        let subfolder_enabled = Zotero.Prefs.get('extensions.zotmoov.enable_subdir_move', true);

        await this.move(atts, dst_path, { ignore_linked: false, into_subfolder: subfolder_enabled });
    },

    async moveSelectedItemsCustomDir()
    {
        let atts = this._getSelectedItems();
        let subfolder_enabled = Zotero.Prefs.get('extensions.zotmoov.enable_subdir_move', true);

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

        await this.move(atts, fp.file.path, { ignore_linked: false, into_subfolder: subfolder_enabled });
    },

    notifyCallback:
    {
        async addCallback(event, ids, extraData)
        {
            let auto_move = Zotero.Prefs.get('extensions.zotmoov.enable_automove', true);
            if (!auto_move) return;

            let items = Zotero.Items.get(ids);
            let dst_path = Zotero.Prefs.get('extensions.zotmoov.dst_dir', true);
            let subfolder_enabled = Zotero.Prefs.get('extensions.zotmoov.enable_subdir_move', true);

            await Zotero.ZotMoov.move(items, dst_path, { into_subfolder: subfolder_enabled });
        },

        async notify(event, type, ids, extraData)
        {
            if (event == 'add') await this.addCallback(event, ids, extraData);
        },
    },
};

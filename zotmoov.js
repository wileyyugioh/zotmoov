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

    _notifierIDMove: null,
    _notifierIDCopy: null,

    init({ id, version, rootURI })
    {
        if(this.initialized) return;

        this.id = id;
        this.version = version;
        this.rootURI = rootURI;
        this.initialized = true;
        this._notifierIDMove = Zotero.Notifier.registerObserver(this.notifyCallbackMove, ['item'], 'zotmoov', 99);
        this._notifierIDCopy = Zotero.Notifier.registerObserver(this.notifyCallback, ['item'], 'zotmoov', 101);
    },

    destroy()
    {
        Zotero.Notifier.unregisterObserver(this._notifierIDMove);
        Zotero.Notifier.unregisterObserver(this._notifierIDCopy);
    },

    _getCopyPath(item, dst_path, into_subfolder)
    {
        let file_path = item.getFilePath();
        let file_name = file_path.split(/[\\/]/).pop();
        let local_dst_path = dst_path;

        // Optionally add subdirectory folder here
        if (into_subfolder)
        {
            // Get parent collection if parent is present
            let collection_ids = item.parentID ? item.parentItem.getCollections() : item.getCollections();

            if(collection_ids.length)
            {
                let collections = Zotero.Collections.get(collection_ids);
                let collection_names = this._getCollectionNamesHierarchy(collections[0]);

                for (let i = collection_names.length - 1; i >= 0; i--) // Iterate backwards
                {
                    let collection_name = collection_names[i];
                    collection_name = Zotero.ZotMoov.Sanitize.sanitize(collection_name, '_'); // Convert to file safe string
                    local_dst_path = PathUtils.join(local_dst_path, collection_name);
                }
            }
        }

        let copy_path = PathUtils.join(local_dst_path, file_name);

        return copy_path;
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
            if (!item.isAttachment()) continue;

            if (options.ignore_linked)
            {
                if (item.attachmentLinkMode != Zotero.Attachments.LINK_MODE_IMPORTED_FILE &&
                    item.attachmentLinkMode != Zotero.Attachments.LINK_MODE_IMPORTED_URL) continue;
            }

            let file_path = item.getFilePath();
            let copy_path = Zotero.ZotMoov._getCopyPath(item, dst_path, options.into_subfolder);

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
                clone = item.clone(null, {includeCollections: true});
                clone.attachmentLinkMode = Zotero.Attachments.LINK_MODE_LINKED_FILE;
                clone.attachmentPath = copy_path;
            }

            promises.push(IOUtils.move(file_path, copy_path).then(function(clone, item)
                {
                    if (clone)
                    {
                        clone.saveTx().then(id => Zotero.Fulltext.indexItems(id)); // reindex clone after saved
                        item.eraseTx(); // delete original item
                    } else
                    {
                        item.saveTx(); // Only save after copied
                    }
                }.bind(null, clone, item))
            );
        }

        return Promise.allSettled(promises);
    },

    async copy(items, dst_path, arg_options = {})
    {
        const default_options = {
            into_subfolder: false,
        };

        let options = {...default_options, ...arg_options};


        if (dst_path == '') return;

        let promises = [];
        for (let item of items)
        {
            let file_path = item.getFilePath();
            let copy_path = Zotero.ZotMoov._getCopyPath(item, dst_path, options.into_subfolder);

            if (file_path == copy_path) continue;

            promises.push(IOUtils.copy(file_path, copy_path));
        }
    },

    // Return collection hierarchy from deepest to shallowest
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
    },

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
    },

    async moveSelectedItems()
    {
        let atts = this._getSelectedItems();
        let dst_path = Zotero.Prefs.get('extensions.zotmoov.dst_dir', true);
        let subfolder_enabled = Zotero.Prefs.get('extensions.zotmoov.enable_subdir_move', true);

        if(Zotero.Prefs.get('extensions.zotmoov.no_copy', true) == 'move')
        {
             await Zotero.ZotMoov.move(atts, dst_path, { ignore_linked: false, into_subfolder: subfolder_enabled });
        } else
        {
            await Zotero.ZotMoov.copy(atts, dst_path, { into_subfolder: subfolder_enabled });
        }
    },

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

        if(Zotero.Prefs.get('extensions.zotmoov.no_copy', true) == 'move')
        {
             await Zotero.ZotMoov.move(atts, fp.file.path, { ignore_linked: false, into_subfolder: false });
        } else
        {
            await Zotero.ZotMoov.copy(atts, fp.file.path, { into_subfolder: false });
        }
    },

    notifyCallbackMove:
    {
        async addCallback(event, ids, extraData)
        {
            let auto_move = Zotero.Prefs.get('extensions.zotmoov.enable_automove', true);
            if (!auto_move) return;

            let items = Zotero.Items.get(ids);
            let dst_path = Zotero.Prefs.get('extensions.zotmoov.dst_dir', true);
            let subfolder_enabled = Zotero.Prefs.get('extensions.zotmoov.enable_subdir_move', true);

            // With snapshots, Zotero adds the file to the database and then
            // moves the file from a temporary directory to the real one
            // We can use the index event handler to snag it
            this._snapshots.push(...items.filter(item => item.isSnapshotAttachment()));
            items = items.filter(item => !item.isSnapshotAttachment());

            if(Zotero.Prefs.get('extensions.zotmoov.no_copy', true) == 'move')
            {
                 await Zotero.ZotMoov.move(items, dst_path, { into_subfolder: subfolder_enabled });
            } else
            {
                // hack to get renamed file copied lol
                this._snapshots.push(...items);
            }
        },

        async indexCallback(event, ids, extraData)
        {
            // Only move the items that we tracked before
            Zotero.log(ids);
            Zotero.log(this._snapshots);
            let items = this._snapshots.filter(item => ids.includes(item.id));
            if(items.length == 0) return;

            let auto_move = Zotero.Prefs.get('extensions.zotmoov.enable_automove', true);
            if (!auto_move) return;

            let dst_path = Zotero.Prefs.get('extensions.zotmoov.dst_dir', true);
            let subfolder_enabled = Zotero.Prefs.get('extensions.zotmoov.enable_subdir_move', true);


            if(Zotero.Prefs.get('extensions.zotmoov.no_copy', true) == 'move')
            {
                 await Zotero.ZotMoov.move(items, dst_path, { ignore_linked: false, into_subfolder: subfolder_enabled });
            } else
            {
                await Zotero.ZotMoov.copy(items, dst_path, { into_subfolder: subfolder_enabled });
            }

            // Remove processed tracked items
            for (let item of items)
            {
                const index = this._snapshots.indexOf(item);
                if (index > -1) this._snapshots.splice(index, 1);
            }
        },

        async notify(event, type, ids, extraData)
        {
            if (event == 'add') await this.addCallback(event, ids, extraData);
            if (event == 'index') await this.indexCallback(event, ids, extraData);
        },
    },
};

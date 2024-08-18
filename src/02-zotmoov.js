Components.utils.importGlobalProperties(['PathUtils', 'IOUtils']);

var ZotMoov = class {
    constructor(id, version, wildcard, sanitizer, zotmoov_debugger) {
        this.id = id;
        this.version = version;

        this.wildcard = wildcard;
        this.sanitizer = sanitizer;
        this.zotmoov_debugger = zotmoov_debugger;
    }

    _getCopyPath(item, dst_path, into_subfolder, subdir_str, arg_options = {})
    {
        const default_options = {
            preferred_collection: null
        };
        let options = {...default_options, ...arg_options};

        let file_path = item.getFilePath();
        let file_name = file_path.split(/[\\/]/).pop();
        let local_dst_path = dst_path;

        // Optionally add subdirectory folder here
        if (into_subfolder)
        {
            let custom_dir = this.wildcard.process_string(item, subdir_str, { preferred_collection: options.preferred_collection });
            let sanitized_custom_dir = custom_dir.split('/').map((dir) => this.sanitizer.sanitize(dir, '_'));
            local_dst_path = PathUtils.join(local_dst_path, ...sanitized_custom_dir);
        }

        let copy_path = PathUtils.join(local_dst_path, file_name);

        return copy_path;
    }

    async delete(items, home_path, arg_options = {})
    {
        const default_options = {
            prune_empty_dir: true
        };

        let options = {...default_options, ...arg_options};

        if (home_path == '') return;
        let home_path_arr = PathUtils.split(home_path);

        let promises = [];
        for (let item of items)
        {
            if (!item.isFileAttachment()) continue;
            if (item.libraryID != Zotero.Libraries.userLibraryID) continue;

            // Check to see if file is a linked file
            if (item.attachmentLinkMode != Zotero.Attachments.LINK_MODE_LINKED_FILE) continue;

            let fp = item.getFilePath();
            let fp_arr = PathUtils.split(fp);

            // Check to see if file is in home_path
            let ok = true;
            for (let [i, dir] of home_path_arr.entries())
            {
                if (dir == fp_arr[i]) continue;

                ok = false;
                break;
            }
            if (!ok) continue;

            // It is, so delete the file
            let p = IOUtils.remove(fp);

            // Delete empty directories recursively up to home directory
            if (options.prune_empty_dir)
            {
                p = p.then(async function()
                {
                    let path_arr = fp_arr.slice();
                    path_arr.pop();

                    while(path_arr.length > home_path_arr.length)
                    {
                        let path = PathUtils.join(...path_arr);
                        let children = await IOUtils.getChildren(path);

                        // Filter out .DS_Store and Thumbs.db
                        let filter_children = children.filter((c) => {
                            let filename = PathUtils.filename(c);
                            return !(['.DS_Store', 'Thumbs.db', 'desktop.ini'].includes(filename));
                        });

                        if (filter_children.length > 0) return;

                        // Delete the pesky files we don't care about
                        for (let child of children)
                        {
                            await IOUtils.remove(child);
                        }

                        // Remove the directory if it is empty
                        await IOUtils.remove(path);
                        path_arr.pop();
                    }
                });
            }

            promises.push(p);
        }

        return Promise.allSettled(promises);
    }

    async move(items, dst_path, arg_options = {})
    {
        const default_options = {
            ignore_linked: true,
            into_subfolder: false,
            subdir_str: '',
            allowed_file_ext: null,
            preferred_collection: null,
            rename_title: true
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

            let copy_path = this._getCopyPath(item, dst_path, options.into_subfolder, options.subdir_str, { preferred_collection: options.preferred_collection });

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
            if(options.rename_title) clone.setField('title', PathUtils.filename(final_path));
            clone.dateAdded = item.dateAdded;

            promises.push(IOUtils.copy(file_path, final_path, { noOverwrite: true }).then(async function(clone, item, final_path)
                {
                    let id = null;
                    try
                    {
                        await Zotero.DB.executeTransaction(async function()
                        {
                            id = await clone.save();
                            await Zotero.Items.moveChildItems(item, clone);
                            await IOUtils.remove(file_path); // Include this in case moving another linked file
                            await item.erase();
                        });
                    } catch (error)
                    {
                        IOUtils.remove(final_path);
                        throw error;
                    }

                    Zotero.Fulltext.indexItems(id);// reindex clone after saved
                }.bind(null, clone, item, final_path))
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
            preferred_collection: null,
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

            let copy_path = this._getCopyPath(item, dst_path, options.into_subfolder, options.subdir_str, { preferred_collection: options.preferred_collection });

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
        let allowed_file_ext = JSON.parse(Zotero.Prefs.get('extensions.zotmoov.allowed_fileext', true));

        // Pass null if empty
        allowed_file_ext = (allowed_file_ext.length) ? allowed_file_ext : null;

        if(Zotero.Prefs.get('extensions.zotmoov.file_behavior', true) == 'move')
        {
            await this.move(atts, dst_path,
                {
                    ignore_linked: false,
                    into_subfolder: subfolder_enabled,
                    subdir_str: subdir_str,
                    allowed_file_ext: allowed_file_ext,
                    preferred_collection: Zotero.getActiveZoteroPane().getSelectedCollection() ? Zotero.getActiveZoteroPane().getSelectedCollection().id : null
                });
        } else
        {
            await this.copy(atts, dst_path,
                {
                    into_subfolder: subfolder_enabled,
                    subdir_str: subdir_str,
                    allowed_file_ext: allowed_file_ext,
                    allow_group_libraries: true,
                    preferred_collection: Zotero.getActiveZoteroPane().getSelectedCollection() ? Zotero.getActiveZoteroPane().getSelectedCollection().id : null
                });
        }
    }

    async moveSelectedItemsCustomDir()
    {
        let atts = this._getSelectedItems();
        let allowed_file_ext = JSON.parse(Zotero.Prefs.get('extensions.zotmoov.allowed_fileext', true));

        // Pass null if empty
        allowed_file_ext = (allowed_file_ext.length) ? allowed_file_ext : null;

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
            await this.move(atts, fp.file.path,
                {
                    ignore_linked: false,
                    into_subfolder: false,
                    allowed_file_ext: allowed_file_ext,
                    preferred_collection: Zotero.getActiveZoteroPane().getSelectedCollection() ? Zotero.getActiveZoteroPane().getSelectedCollection().id : null
                });
        } else
        {
            await this.copy(atts, fp.file.path,
                {
                    into_subfolder: false,
                    allow_group_libraries: true,
                    allowed_file_ext: allowed_file_ext,
                    preferred_collection: Zotero.getActiveZoteroPane().getSelectedCollection() ? Zotero.getActiveZoteroPane().getSelectedCollection().id : null
                });
        }
    }
}



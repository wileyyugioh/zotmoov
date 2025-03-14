Components.utils.importGlobalProperties(['PathUtils', 'IOUtils']);

var ZotMoov = class {
    constructor(id, version, rootURI, wildcard, sanitizer, zotmoov_debugger) {
        this.id = id;
        this.version = version;
        this.rootURI = rootURI;

        this.wildcard = wildcard;
        this.sanitizer = sanitizer;
        this.zotmoov_debugger = zotmoov_debugger;
    }

    async _getCopyPath(item, dst_path, arg_options = {})
    {
        const default_options = {
            into_subfolder: false,
            subdir_str: '',
            preferred_collection: null,
            undefined_str: 'undefined',
            custom_wc: {},
            rename_file: true,
        };
        let options = {...default_options, ...arg_options};

        let file_path = item.getFilePath();
        if (!file_path) return '';

        let file_name = file_path.split(/[\\/]/).pop();
        if (options.rename_file && item.parentItem)
        {
            const file_ext = file_path.split('.').pop().toLowerCase();
            let renamed = await Zotero.Attachments.getRenamedFileBaseNameIfAllowedType(item.parentItem, file_path);
            if (renamed) file_name = renamed + '.' + file_ext;
        }

        let local_dst_path = dst_path;

        // Optionally add subdirectory folder here
        if (options.into_subfolder)
        {
            let custom_dir = this.wildcard.process_string(item, options.subdir_str, {
                preferred_collection: options.preferred_collection,
                undefined_str: options.undefined_str,
                custom_wc: options.custom_wc
            });
            let sanitized_custom_dir = custom_dir.split('/').map((dir) => this.sanitizer.sanitize(dir, '_'));
            local_dst_path = PathUtils.join(local_dst_path, ...sanitized_custom_dir);
        }

        let copy_path = PathUtils.join(local_dst_path, file_name);

        return copy_path;
    }

   async delete(items, home_path, arg_options = {})
    {
        const default_options = {
            prune_empty_dir: true,
            max_io: 10
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
            if (!fp) continue;
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

            promises.push(async () => {
                // It is, so delete the file
                let p = await IOUtils.remove(fp);

                // Delete empty directories recursively up to home directory
                if (options.prune_empty_dir)
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
                }
            });
        }

        const it = promises.values();
        const workers = Array(options.max_io).fill(it).map(async (my_it) => {
            for (let p_gen of my_it)
            {
                try
                {
                    await p_gen();
                }
                catch(e)
                {
                    Zotero.logError(e);
                    continue;
                }
            }
        });

        await Promise.allSettled(workers);
    }

    async move(items, dst_path, arg_options = {})
    {
        const default_options = {
            ignore_linked: false,
            into_subfolder: false,
            subdir_str: '',
            allowed_file_ext: null,
            preferred_collection: null,
            rename_title: true,
            undefined_str: 'undefined',
            custom_wc: {},
            add_zotmoov_tag: true,
            tag_str: 'zotmoov',
            rename_file: true,
            max_io: 10
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
            if (!file_path) continue;

            // Test to see if file extension is allowed
            if (Array.isArray(options.allowed_file_ext))
            {
                let file_ext = file_path.split('.').pop().toLowerCase();
                if (!options.allowed_file_ext.includes(file_ext)) continue;
            }

            let copy_path = await this._getCopyPath(item, dst_path,
                {
                    into_subfolder: options.into_subfolder,
                    subdir_str: options.subdir_str,
                    preferred_collection: options.preferred_collection,
                    undefined_str: options.undefined_str,
                    custom_wc: options.custom_wc,
                    rename_file: options.rename_file
            });
            
            if (!copy_path) continue;

            // Have to check since later adding an entry triggers the
            // handler again
            if (file_path == copy_path) continue;

            let final_path = copy_path;
            let path_arr = final_path.split('.');
            let file_ext = path_arr.pop();
            let rest_of_path = path_arr.join('.');

            let i = 1;
            while(await IOUtils.exists(final_path)) final_path = rest_of_path + ' ' + (i++) + '.' + file_ext;

            // Shorten the filename if needed
            // Note that this creates a temp file
            try
            {
                const short_filename = Zotero.File.createShortened(final_path, Components.interfaces.nsIFile.NORMAL_FILE_TYPE, 0o644);
                final_path = PathUtils.join(PathUtils.parent(final_path), short_filename);
            } catch (e) {
                Zotero.logError(e);
                continue;
            }

            let clone = item.clone(null, { includeCollections: true });
            clone.attachmentLinkMode = Zotero.Attachments.LINK_MODE_LINKED_FILE;
            clone.attachmentPath = final_path;
            if (options.rename_title) clone.setField('title', PathUtils.filename(final_path));
            clone.dateAdded = item.dateAdded;

            if (options.add_zotmoov_tag) clone.addTag(options.tag_str);

            promises.push(async () => {
                try
                {
                    await IOUtils.copy(file_path, final_path);

                    await Zotero.DB.executeTransaction(async () => {
                        let id = await clone.save();
                        await Zotero.Items.moveChildItems(item, clone);
                        await Zotero.Relations.copyObjectSubjectRelations(item, clone);
                        await Zotero.Fulltext.transferItemIndex(item, clone).catch((e) => { Zotero.logError(e); });

                        // Update links in notes
                        let parent = item.parentItem;
                        if (parent)
                        {
                            let notes = Zotero.Items.get(parent.getNotes());
                            for (let note of notes)
                            {
                                Zotero.Notes.replaceItemKey(note, item.key, clone.key);
                                await note.save();
                            }
                        }

                        // Update timestamps
                        const file_info = await IOUtils.stat(file_path);
                        IOUtils.setModificationTime(final_path, file_info.lastModified);

                        await item.erase();
                        await IOUtils.remove(file_path); // Include this in case moving another linked file
                    });

                    return clone;
                }
                catch(e)
                {
                    // In case of copy failure we need to remove the temp file generated by Zotero.File.createShortened or copied file
                    IOUtils.remove(final_path);
                    throw e;
                }
            });
        }

        let results = [];
        const it = promises.values();
        const workers = Array(options.max_io).fill(it).map(async (my_it) => {
            for (let p_gen of my_it)
            {
                try
                {
                    results.push(await p_gen());
                }
                catch(e)
                {
                    Zotero.logError(e);
                    continue;
                }
            }
        });

        await Promise.allSettled(workers);

        return results;
    }

    async copy(items, dst_path, arg_options = {})
    {
        const default_options = {
            into_subfolder: false,
            subdir_str: '',
            allow_group_libraries: false,
            allowed_file_ext: null,
            preferred_collection: null,
            undefined_str: 'undefined',
            custom_wc: {},
            rename_file: true,
            max_io: 10
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
            if (!file_path) continue;

            // Test to see if file extension is allowed
            if (Array.isArray(options.allowed_file_ext))
            {
                let file_ext = file_path.split('.').pop().toLowerCase();
                if (!options.allowed_file_ext.includes(file_ext)) continue;
            }

            let copy_path = await this._getCopyPath(item, dst_path, {
                    into_subfolder: options.into_subfolder,
                    subdir_str: options.subdir_str,
                    preferred_collection: options.preferred_collection,
                    undefined_str: options.undefined_str,
                    custom_wc: options.custom_wc,
                    rename_file: options.rename_file
            });
            
            if (!copy_path) continue;
            if (file_path == copy_path) continue;

            let final_path = copy_path;
            let path_arr = final_path.split('.');
            let file_ext = path_arr.pop();
            let rest_of_path = path_arr.join('.');

            let i = 1;
            while (await IOUtils.exists(final_path)) final_path = rest_of_path + ' ' + (i++) + '.' + file_ext;

            try
            {
                const short_filename = Zotero.File.createShortened(final_path, Components.interfaces.nsIFile.NORMAL_FILE_TYPE, 0o644);
                final_path = PathUtils.join(PathUtils.parent(final_path), short_filename);
            } catch (e) {
                Zotero.logError(e);
                continue;
            }

            promises.push(async () => {
                try
                {
                    await IOUtils.copy(file_path, final_path);

                    return item
                }
                catch(e)
                {
                    IOUtils.remove(final_path);
                    throw e;
                }
            });
        }

        let results = [];
        const it = promises.values();
        const workers = Array(options.max_io).fill(it).map(async (my_it) => {
            for (let p_gen of my_it)
            {
                try
                {
                    results.push(await p_gen());
                }
                catch(e)
                {
                    Zotero.logError(e);
                    continue;
                }
            }
        });

        await Promise.allSettled(workers);

        return results;
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
        if (!atts.size) return;

        let dst_path = Zotero.Prefs.get('extensions.zotmoov.dst_dir', true);

        let pref = this.getBasePrefs();
        if (Zotero.Prefs.get('extensions.zotmoov.file_behavior', true) == 'move')
        {
            await this.move(atts, dst_path, pref);
        } else
        {
            await this.copy(atts, dst_path, pref);
        }
    }

    async moveFrom(items, arg_options = {})
    {
        const default_options = {
            add_zotmoov_tag: true,
            tag_str: 'zotmoov',
            max_io: 10
        };

        let options = {...default_options, ...arg_options};

        let atts = Array.from(items).filter((a) => { return a.isLinkedFileAttachment(); });

        let promises = atts.map((item) => {
            return async () => {
                let orig_key = item.key;
                let stored = await Zotero.Attachments.convertLinkedFileToStoredFile(item, { move: true });

                // Update links in notes
                let parent = stored.parentItem;
                if (parent)
                {
                    let notes = Zotero.Items.get(parent.getNotes());
                    for (let note of notes)
                    {
                        Zotero.Notes.replaceItemKey(note, orig_key, stored.key);
                        await note.saveTx();
                    }
                }

                if (!options.add_zotmoov_tag) return stored;

                if (stored.removeTag(options.tag_str)) await stored.saveTx();

                return stored;
            }
        });


        let results = [];
        const it = promises.values();
        const workers = Array(options.max_io).fill(it).map(async (my_it) => {
            for (let p_gen of my_it)
            {
                try
                {
                    results.push(await p_gen());
                }
                catch(e)
                {
                    Zotero.logError(e);
                    continue;
                }
            }
        });

        await Promise.allSettled(workers);

        return results;
    }

    async moveFromDirectory()
    {
        let atts = this._getSelectedItems();
        if (!atts.size) return;

        let pref = this.getBasePrefs();
        this.moveFrom(atts, pref);
    }

    async moveSelectedItemsCustomDir()
    {
        let atts = this._getSelectedItems();
        if (!atts.size) return;

        const { FilePicker } = ChromeUtils.importESModule('chrome://zotero/content/modules/filePicker.mjs');
        let fp = new FilePicker();

        let wm = Services.wm;
        let win = wm.getMostRecentWindow('navigator:browser');

        fp.init(win, Zotero.getString('dataDir.selectDir'), fp.modeGetFolder);
        fp.appendFilters(fp.filterAll);
        
        let rv = await fp.show();
        if (rv != fp.returnOK) return '';

        let pref = this.getBasePrefs();
        pref.into_subfolder = false;
        if(Zotero.Prefs.get('extensions.zotmoov.file_behavior', true) == 'move')
        {
            await this.move(atts, fp.file, pref);
        } else
        {
            await this.copy(atts, fp.file, pref);
        }
    }

    getBasePrefs()
    {
        let allowed_file_ext = JSON.parse(Zotero.Prefs.get('extensions.zotmoov.allowed_fileext', true));
        // Pass null if empty
        allowed_file_ext = (allowed_file_ext.length) ? allowed_file_ext : null;

        return {
            ignore_linked: false,
            into_subfolder: Zotero.Prefs.get('extensions.zotmoov.enable_subdir_move', true),
            subdir_str: Zotero.Prefs.get('extensions.zotmoov.subdirectory_string', true),
            rename_title: Zotero.Prefs.get('extensions.zotmoov.rename_title', true),
            allowed_file_ext: allowed_file_ext,
            preferred_collection: (Zotero.getActiveZoteroPane().getSelectedCollection() ? Zotero.getActiveZoteroPane().getSelectedCollection().id : null),
            undefined_str: Zotero.Prefs.get('extensions.zotmoov.undefined_str', true),
            allow_group_libraries: Zotero.Prefs.get('extensions.zotmoov.copy_group_libraries', true),
            custom_wc: JSON.parse(Zotero.Prefs.get('extensions.zotmoov.cwc_commands', true)),
            add_zotmoov_tag: Zotero.Prefs.get('extensions.zotmoov.add_zotmoov_tag', true),
            tag_str: Zotero.Prefs.get('extensions.zotmoov.tag_str', true),
            rename_file: Zotero.Attachments.shouldAutoRenameFile(),
            max_io: Zotero.Prefs.get('extensions.zotmoov.max_io_concurrency', true)
        };
    }
}



var ZotMoovNewMenus = class
{
    static get hasFeatures()
    {
        return 'MenuManager' in Zotero;
    }

    get SHORTCUTS()
    {
        return {
            'extensions.zotmoov.keys.move_item': () => { Zotero.ZotMoov.moveSelectedItems(); },
            'extensions.zotmoov.keys.link_item': () => { this.importLastModifiedFile(); },
            'extensions.zotmoov.keys.convert_linked': () => { Zotero.ZotMoov.moveFromDirectory(); },
            'extensions.zotmoov.keys.move_item_custom_dir': () => { Zotero.ZotMoov.moveSelectedItemsCustomDir(); },
        };
    }

    _genMenus()
    {
        let self = this;
        const mv_move = [
            // Move Selected Menu item
            {
                menuType: 'menuitem',
                l10nID: 'zotmoov-context-move-selected',
                onShowing: (event, context) => {
                    let should_disabled = (!this._hasAttachments() ||
                        (Zotero.getActiveZoteroPane().getSelectedLibraryID() != Zotero.Libraries.userLibraryID && Zotero.Prefs.get('extensions.zotmoov.file_behavior', true) == 'move')
                    );
                    context.setEnabled(!should_disabled);
                },
                onCommand: (event, context) => {
                    self._zotmoov.moveSelectedItems();
                },
            },
        ];

        const mv_custom_move = [
            // Custom Dir Menu item
            {
                menuType: 'menuitem',
                l10nID: 'zotmoov-context-move-selected-custom-dir',
                onShowing: (event, context) => {
                    let should_disabled = (!this._hasAttachments() ||
                        (Zotero.getActiveZoteroPane().getSelectedLibraryID() != Zotero.Libraries.userLibraryID && Zotero.Prefs.get('extensions.zotmoov.file_behavior', true) == 'move')
                    );
                    context.setEnabled(!should_disabled);
                },
                onCommand: (event, context) => {
                    self._zotmoov.moveSelectedItemsCustomDir();
                },
            },
        ];

        const cp_move = [
            // Copy Selected Menu item
            {
                menuType: 'menuitem',
                l10nID: 'zotmoov-context-copy-selected',
                onShowing: (event, context) => {
                    let should_disabled = (!this._hasAttachments() ||
                        (Zotero.getActiveZoteroPane().getSelectedLibraryID() != Zotero.Libraries.userLibraryID && Zotero.Prefs.get('extensions.zotmoov.file_behavior', true) == 'move')
                    );
                    context.setEnabled(!should_disabled);
                },
                onCommand: (event, context) => {
                    self._zotmoov.moveSelectedItems();
                },
            },
        ];

        const cp_custom_move = [
            // Custom Dir Copy Menu item
            {
                menuType: 'menuitem',
                l10nID: 'zotmoov-context-copy-selected-custom-dir',
                onShowing: (event, context) => {
                    let should_disabled = (!this._hasAttachments() ||
                        (Zotero.getActiveZoteroPane().getSelectedLibraryID() != Zotero.Libraries.userLibraryID && Zotero.Prefs.get('extensions.zotmoov.file_behavior', true) == 'move')
                    );
                    context.setEnabled(!should_disabled);
                },
                onCommand: (event, context) => {
                    self._zotmoov.moveSelectedItemsCustomDir();
                },
            },
        ];

        const attach_menus = [
            // Attach New File
            {
                menuType: 'menuitem',
                l10nID: 'zotmoov-context-attach-new-file',
                onShowing: (event, context) => {
                    let selection = Zotero.getActiveZoteroPane().getSelectedItems();
                    const disable_attach_new_file_id = (selection.length != 1 || !selection[0].isRegularItem());
                    context.setEnabled(!disable_attach_new_file_id);
                },
                onCommand: (event, context) => {
                    self.importLastModifiedFile();
                },
            },
        ];

        const convert_menus = [
            // Convert Linked to Stored File
            {
                menuType: 'menuitem',
                l10nID: 'zotmoov-context-convert-linked',
                onShowing: (event, context) => {
                    const disable_convert_linked = !Array.from(this._zotmoov._getSelectedItems()).some(s => s.attachmentLinkMode == Zotero.Attachments.LINK_MODE_LINKED_FILE);
                    context.setEnabled(!disable_convert_linked);
                },
                onCommand: (event, context) => {
                    self._zotmoov.moveFromDirectory();
                },
            },
        ];

        const note_fix_menus = [
            // Fix broken links in notes
            {
                menuType: 'menuitem',
                l10nID: 'zotmoov-context-fix-note-links',
                onShowing: (event, context) => {
                    context.setEnabled(self._getSelectedNotes().size > 0)
                },
                onCommand: (event, context) => {
                    self.fixNoteLinks();
                },
            },
        ];

        let menus = [];
        if (this._move_visible)
        {
            if (!Zotero.Prefs.get('extensions.zotmoov.menu_items.move.hidden', true)) menus.push(...mv_move);
            if (!Zotero.Prefs.get('extensions.zotmoov.menu_items.custom_move.hidden', true)) menus.push(...mv_custom_move);
        } else
        {
            if (!Zotero.Prefs.get('extensions.zotmoov.menu_items.move.hidden', true)) menus.push(...cp_move);
            if (!Zotero.Prefs.get('extensions.zotmoov.menu_items.custom_move.hidden', true)) menus.push(...cp_custom_move);
        }

        if (this._attach_visible)
        {
            menus.push(...attach_menus);
        }

        if (!Zotero.Prefs.get('extensions.zotmoov.menu_items.convert_linked.hidden', true))
        {
            menus.push(...convert_menus);
        }

        if (!Zotero.Prefs.get('extensions.zotmoov.menu_items.fix_note_links.hidden', true))
        {
            menus.push(...note_fix_menus);
        }

        for (let menu of Object.values(this._custom_mus))
        {
            menus.push(menu);
        }

        // RIP. No way to update menus...
        if (this._menumanager_id) Zotero.MenuManager.unregisterMenu(this._menumanager_id);

        this._menumanager_id = Zotero.MenuManager.registerMenu({
            menuID: 'zotmoov-itemmenu',
            pluginID: 'zotmoov@wileyy.com', // Hard coded...
            target: 'main/library/item',
            menus: menus
        });

    }

    constructor(zotmoov, bindings, custom_mu)
    {
        this._zotmoov = zotmoov;
        this._zotmoov_bindings = bindings;
        this._custom_mu_parser = custom_mu;

        this._keydown_commands = {};
        this._scs = {};

        this._move_visible = true;
        this._attach_visible = true;

        this._custom_mus = {};
        this._menumanager_id = null;
    }

    _loadPrefObs()
    {
        let self = this;
        this._move_pref_obs = Zotero.Prefs.registerObserver('extensions.zotmoov.menu_items.move.hidden', () => {
            self._genMenus();
        }, true);

        this._convert_pref_obs = Zotero.Prefs.registerObserver('extensions.zotmoov.menu_items.convert_linked.hidden', () => {
            self._genMenus();
        }, true);

        this._custom_move_pref_obs = Zotero.Prefs.registerObserver('extensions.zotmoov.menu_items.custom_move.hidden', () => {
            self._genMenus();
        }, true);

        this._fix_note_links_obs = Zotero.Prefs.registerObserver('extensions.zotmoov.menu_items.fix_note_links.hidden', () => {
            self._genMenus();
        }, true);
    }

    _unloadPrefObs()
    {
        Zotero.Prefs.unregisterObserver(this._move_pref_obs);
        Zotero.Prefs.unregisterObserver(this._convert_pref_obs);
        Zotero.Prefs.unregisterObserver(this._custom_move_pref_obs);
        Zotero.Prefs.unregisterObserver(this._fix_note_links_obs);
    }

    _addCustomMenuItem(id, label, key)
    {

        let self = this;
        const custom_mu = {
            menuType: 'menuitem',
            l10nID: 'zotmoov-context-custom-menuitem-title',
            l10nArgs: { text: label },
            onCommand: (event, context) => {
                const cmu = JSON.parse(Zotero.Prefs.get('extensions.zotmoov.custom_menu_items', true));
                if (!cmu) return;
                (new this._custom_mu_parser(cmu)).apply(key, Array.from(self._zotmoov._getSelectedItems()));
            },
        };

        this._custom_mus[id] = custom_mu;
    }


    addCustomMenuItemAllWin(id, label, key)
    {
        this._addCustomMenuItem(id, label, key);

        const PREF_PREFIX = 'extensions.zotmoov.keys.custom.';
        const pref_str = PREF_PREFIX + key.replace(/\s/g, '_');

        this._scs[pref_str] = () => {
                let cmu = JSON.parse(Zotero.Prefs.get('extensions.zotmoov.custom_menu_items', true));
                (new this._custom_mu_parser(cmu)).apply(key, Array.from(this._zotmoov._getSelectedItems()));
        };

        this._genMenus();
    }

    _removeCustomMenuItem(id, key)
    {
        delete this._custom_mus[id];
    }

    removeCustomMenuItemAllWin(id, key)
    {
        this._removeCustomMenuItem(id, key);

        const PREF_PREFIX = 'extensions.zotmoov.keys.custom.';
        const pref_str = PREF_PREFIX + key.replace(/\s/g, '_');

        // Kinda hacky but whatever
        this.rebindPrefToKey(pref_str, '');
        delete this._scs[pref_str];
        Zotero.Prefs.clear(pref_str, true);

        this._genMenus();
    }

    _loadCMUFromPrefs()
    {
        const cmus = JSON.parse(Zotero.Prefs.get('extensions.zotmoov.custom_menu_items', true));
        for (let cmu of Object.keys(cmus))
        {
            const id = 'zotmoov-' + cmu.replace(/\s/g, '_');
            this._addCustomMenuItem(id, cmu, cmu);
        }
    }

    _loadShortcuts()
    {
        this._scs = this.SHORTCUTS;

        let cmus = JSON.parse(Zotero.Prefs.get('extensions.zotmoov.custom_menu_items', true));
        for (let key of Object.keys(cmus))
        {
            const PREF_PREFIX = 'extensions.zotmoov.keys.custom.';
            const pref_str = PREF_PREFIX + key.replace(/\s/g, '_');

            this._scs[pref_str] = () => {
                    let cmu = JSON.parse(Zotero.Prefs.get('extensions.zotmoov.custom_menu_items', true));
                    (new this._custom_mu_parser(cmu)).apply(key, Array.from(this._zotmoov._getSelectedItems()));
            };
        }

        for (let pref of Object.keys(this._scs))
        {
            let key = Zotero.Prefs.get(pref, true);
            if (!key) continue;

            this._keydown_commands[key.toUpperCase()] = pref;
        }
    }

    _doKeyDown(event)
    {
        if (!event.shiftKey) return;
        if (Zotero.isMac ? !event.metaKey : !event.ctrlKey) return;

        let pref = this._keydown_commands[event.key.toUpperCase()];
        if (pref) this._scs[pref].apply(this);
    }

    rebindPrefToKey(pref, key)
    {
        const found_key = Object.keys(this._keydown_commands).find((k) =>
        {
            return this._keydown_commands[k] == pref;
        });

        if (found_key != undefined) this._keydown_commands[found_key] = null;

        if (key) this._keydown_commands[key.toUpperCase()] = pref;
    }

    _hasAttachments()
    {
        let items = this._zotmoov._getSelectedItems();
        return (items.size != 0);
    }

    load(win)
    {
        let doc = win.document;
        doc.addEventListener('keydown', (event) =>
        {
            this._doKeyDown(event);
        });

        // Enable localization
        win.MozXULElement.insertFTLIfNeeded('zotmoov.ftl');
    }

    _doSetMove()
    {
        this._move_visible = true;
    }

    setMove()
    {
        this._doSetMove();
        this._genMenus();
    }

    _doSetCopy()
    {
        this._move_visible = false;
    }

    setCopy()
    {
        this._doSetCopy();
        this._genMenus();
    }

    unload(win)
    {
    }

    init()
    {
        this._loadShortcuts();
        this._loadPrefObs();
    }

    loadAll()
    {
        if(Zotero.Prefs.get('extensions.zotmoov.file_behavior', true) == 'move')
        {
            this._doSetMove();
        } else
        {
            this._doSetCopy();
        }

        if(!Zotero.Prefs.get('extensions.zotmoov.enable_attach_dir', true)) this._doHideAttachNewFile();

        this._loadCMUFromPrefs();

        let windows = Zotero.getMainWindows();
        for(let win of windows)
        {
            this.load(win);
        }

        this._genMenus();
    }

    unloadAll()
    {
        Zotero.MenuManager.unregisterMenu(this._menumanager_id);
    }

    destroy()
    {
        this.unloadAll();
        this._unloadPrefObs();
    }

    _doHideAttachNewFile()
    {
        this._attach_visible = false;
    }

    hideAttachNewFile()
    {
        this._doHideAttachNewFile();
        this._genMenus();
    }

    _doShowAttachNewFile()
    {
        this._attach_visible = true;
    }

    showAttachNewFile()
    {
        this._doShowAttachNewFile();
        this._genMenus();
    }

    _getSelectedNotes()
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
        let notes = this._getSelectedNotes();
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

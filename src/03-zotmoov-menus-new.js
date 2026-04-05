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

        if (!Zotero.Prefs.get('extensions.zotmoov.menu_items.convert_linked.hidden', true))
        {
            menus.push(...convert_menus);
        }

        if (this._attach_visible)
        {
            menus.push(...attach_menus);
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

    constructor(zotmoov, menu_helper, custom_mu)
    {
        this._zotmoov = zotmoov;
        this._menu_helper = menu_helper;
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
        return this._menu_helper.getSelectedNotes();
    }

    async fixNoteLinks()
    {
        return this._menu_helper.fixNoteLinks();
    }

    async importLastModifiedFile()
    {
        return this._menu_helper.importLastModifiedFile();
    }
}

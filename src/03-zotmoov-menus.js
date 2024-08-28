var ZotMoovMenus = class {
    constructor(zotmoov, bindings) {
        this.menuseparator_id = 'zotmoov-context-menuseparator';
        this.move_selected_item_id = 'zotmoov-context-move-selected';
        this.move_selected_item_custom_id = 'zotmoov-context-move-selected-custom-dir';
        this.attach_new_file_id = 'zotmoov-context-attach-new-file';
        this.convert_linked_to_stored_id = 'zotmoov-context-convert-linked-to-stored';

        this._zotmoov = zotmoov;
        this._zotmoovBindings = bindings;

        this._popupShowing = this._doPopupShowing.bind(this);
    }

    _doPopupShowing(event)
    {
        let should_disabled = (!this._hasAttachments() ||
            (Zotero.getActiveZoteroPane().getSelectedLibraryID() != Zotero.Libraries.userLibraryID && Zotero.Prefs.get('extensions.zotmoov.file_behavior', true) == 'move')
        );
        let selection = Zotero.getActiveZoteroPane().getSelectedItems();

        let win = event.view;
        if(!win) return;

        win.document.getElementById(this.move_selected_item_id).disabled = should_disabled;
        win.document.getElementById(this.move_selected_item_custom_id).disabled = should_disabled;
        win.document.getElementById(this.convert_linked_to_stored_id).disabled = should_disabled;

        const disable_attach_new_file_id = (selection.length != 1 || !selection[0].isRegularItem());
        win.document.getElementById(this.attach_new_file_id).disabled = disable_attach_new_file_id;

        const disable_convert_linked = !Array.from(this._zotmoov._getSelectedItems()).some(s => s.attachmentLinkMode == Zotero.Attachments.LINK_MODE_LINKED_FILE);
        win.document.getElementById(this.convert_linked_to_stored_id).disabled = disable_convert_linked;
    }

    _hasAttachments()
    {
        let items = this._zotmoov._getSelectedItems();
        return (items.size != 0);
    }

    load(win)
    {
        let doc = win.document;

        // Menu separator
        let menuseparator = doc.createXULElement('menuseparator');
        menuseparator.id = this.menuseparator_id;

        // Move Selected Menu item
        let move_selected_item = doc.createXULElement('menuitem');
        move_selected_item.id = this.move_selected_item_id;

        let self = this;
        move_selected_item.addEventListener('command', () =>
        {
            self._zotmoov.moveSelectedItems();
        });

        // Custom Dir Menu item
        let move_selected_item_custom = doc.createXULElement('menuitem');
        move_selected_item_custom.id = this.move_selected_item_custom_id;
        move_selected_item_custom.addEventListener('command', () =>
        {
            self._zotmoov.moveSelectedItemsCustomDir();
        });

        // Attach New File
        let attach_new_file = doc.createXULElement('menuitem');
        attach_new_file.id = this.attach_new_file_id;
        attach_new_file.setAttribute('data-l10n-id', 'zotmoov-context-attach-new-file');
        attach_new_file.addEventListener('command', () =>
        {
            self.importLastModifiedFile();
        });

        // Convert Linked to Stored File
        let convert_linked_to_stored = doc.createXULElement('menuitem');
        convert_linked_to_stored.id = this.convert_linked_to_stored_id;
        convert_linked_to_stored.setAttribute('data-l10n-id', 'zotmoov-context-convert-linked');
        convert_linked_to_stored.addEventListener('command', () =>
        {
            Zotero.getActiveZoteroPane().convertLinkedFilesToStoredFiles();
        });

        let zotero_itemmenu = doc.getElementById('zotero-itemmenu');
        zotero_itemmenu.addEventListener('popupshowing', this._popupShowing);

        zotero_itemmenu.appendChild(menuseparator);
        zotero_itemmenu.appendChild(move_selected_item);
        zotero_itemmenu.appendChild(move_selected_item_custom);
        zotero_itemmenu.appendChild(convert_linked_to_stored);
        zotero_itemmenu.appendChild(attach_new_file);

        if(Zotero.Prefs.get('extensions.zotmoov.file_behavior', true) == 'move')
        {
            this.setMove();
        } else
        {
            this.setCopy();
        }

        if(!Zotero.Prefs.get('extensions.zotmoov.enable_attach_dir', true)) this.hideAttachNewFile();

        // Enable localization
        win.MozXULElement.insertFTLIfNeeded('zotmoov.ftl');
    }

    setMove()
    {
        let windows = Zotero.getMainWindows();
        for(let win of windows)
        {
            if(!win.ZoteroPane) continue;
            win.document.getElementById(this.move_selected_item_id).setAttribute('data-l10n-id', 'zotmoov-context-move-selected');
            win.document.getElementById(this.move_selected_item_custom_id).setAttribute('data-l10n-id', 'zotmoov-context-move-selected-custom-dir');
        }
    }

    setCopy()
    {
        let windows = Zotero.getMainWindows();
        for (let win of windows)
        {
            if(!win.ZoteroPane) continue;
            win.document.getElementById(this.move_selected_item_id).setAttribute('data-l10n-id', 'zotmoov-context-copy-selected');
            win.document.getElementById(this.move_selected_item_custom_id).setAttribute('data-l10n-id', 'zotmoov-context-copy-selected-custom-dir');
        }
    }

    unload(win)
    {
        let doc = win.document;

        win.document.getElementById(this.menuseparator_id).remove();
        win.document.getElementById(this.move_selected_item_id).remove();
        win.document.getElementById(this.move_selected_item_custom_id).remove();
        win.document.getElementById(this.attach_new_file_id).remove();
        win.document.getElementById(this.convert_linked_to_stored_id).remove();
        doc.querySelector('[href="zotmoov.ftl"]').remove();

        let zotero_itemmenu = doc.getElementById('zotero-itemmenu');
        zotero_itemmenu.removeEventListener('popupshowing', this._popupShowing);
    }

    loadAll()
    {
        let windows = Zotero.getMainWindows();
        for (let win of windows)
        {
            if(!win.ZoteroPane) continue;
            this.load(win);
        }
    }

    unloadAll()
    {
        let windows = Zotero.getMainWindows();
        for (let win of windows)
        {
            if(!win.ZoteroPane) continue;
            this.unload(win);
        }
    }

    hideAttachNewFile()
    {
        let windows = Zotero.getMainWindows();
        for(let win of windows)
        {
            if(!win.ZoteroPane) continue;
            win.document.getElementById(this.attach_new_file_id).hidden = true;
        }
    }

    showAttachNewFile()
    {
        let windows = Zotero.getMainWindows();
        for(let win of windows)
        {
            if(!win.ZoteroPane) continue;
            win.document.getElementById(this.attach_new_file_id).hidden = false;
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
        if(items.length != 1 || !items[0].isRegularItem()) return; // Only run if only one file is selected

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
                let file_ext = filename.split('.').pop().toLowerCase();
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

        const options = {
            'file': lastFilePath,
            'fileBaseName': fileBaseName,
            'parentItemID': items[0].id,
            'libraryID': items[0].libraryID,
        };

        this._zotmoovBindings.disable();
        let att = await Zotero.Attachments.importFromFile(options);
        this._zotmoovBindings.enable();

        if (att.getFilePath() != lastFilePath) IOUtils.remove(lastFilePath);


        let dst_path = Zotero.Prefs.get('extensions.zotmoov.dst_dir', true);
        let subfolder_enabled = Zotero.Prefs.get('extensions.zotmoov.enable_subdir_move', true);
        let subdir_str = Zotero.Prefs.get('extensions.zotmoov.subdirectory_string', true);

        if(should_move)
        {
            await this._zotmoov.move([att], dst_path,
                {
                    ignore_linked: false,
                    into_subfolder: subfolder_enabled,
                    subdir_str: subdir_str,
                    allowed_file_ext: allowed_file_ext,
                    preferred_collection: (Zotero.getActiveZoteroPane().getSelectedCollection() ? Zotero.getActiveZoteroPane().getSelectedCollection().id : null),
                    rename_title: rename_title
                });
        } else
        {
            let allow_group_libraries = Zotero.Prefs.get('extensions.zotmoov.copy_group_libraries', true);
            await this._zotmoov.copy([att], dst_path,
                {
                    into_subfolder: subfolder_enabled,
                    subdir_str: subdir_str,
                    allowed_file_ext: allowed_file_ext,
                    allow_group_libraries: allow_group_libraries,
                    preferred_collection: Zotero.getActiveZoteroPane().getSelectedCollection() ? Zotero.getActiveZoteroPane().getSelectedCollection().id : null
                });
        }
    }
}

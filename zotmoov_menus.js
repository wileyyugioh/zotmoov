// ZotMoov
// zotmoov_menus.js
// Written by Wiley Yu

Components.utils.import('resource://gre/modules/Services.jsm');

Zotero.ZotMoov.Menus = {
    menuseparator_id: 'zotmoov-context-menuseparator',
    move_selected_item_id: 'zotmoov-context-move-selected',
    move_selected_item_custom_id: 'zotmoov-context-move-selected-custom-dir',

    _popupShowing(win)
    {
        let should_disabled = !Zotero.ZotMoov.Menus._hasAttachments();

        win.document.getElementById(Zotero.ZotMoov.Menus.move_selected_item_id).disabled = should_disabled;
        win.document.getElementById(Zotero.ZotMoov.Menus.move_selected_item_custom_id).disabled = should_disabled;
    },

    _hasAttachments()
    {
        let items = Zotero.ZotMoov._getSelectedItems();
        return (items.size != 0);
    },

    load(win)
    {
        let doc = win.document;

        // Menu separator
        let menuseparator = doc.createXULElement('menuseparator');
        menuseparator.id = this.menuseparator_id;

        // Move Selected Menu item
        let move_selected_item = doc.createXULElement('menuitem');
        move_selected_item.id = this.move_selected_item_id;
        move_selected_item.addEventListener('command', function()
        {
            Zotero.ZotMoov.moveSelectedItems();
        });

        // Custom Dir Menu item
        let move_selected_item_custom = doc.createXULElement('menuitem');
        move_selected_item_custom.id = this.move_selected_item_custom_id;
        move_selected_item_custom.addEventListener('command', function()
        {
            Zotero.ZotMoov.moveSelectedItemsCustomDir();
        });

        let zotero_itemmenu = doc.getElementById('zotero-itemmenu');
        zotero_itemmenu.addEventListener('popupshowing', () => this._popupShowing(win));

        zotero_itemmenu.appendChild(menuseparator);
        zotero_itemmenu.appendChild(move_selected_item);
        zotero_itemmenu.appendChild(move_selected_item_custom);

        if(Zotero.Prefs.get('extensions.zotmoov.file_behavior', true) == 'move')
        {
            this.setMove();
        } else
        {
            this.setCopy();
        }

        // Enable localization
        win.MozXULElement.insertFTLIfNeeded('zotmoov.ftl');
    },

    setMove()
    {
        let windows = Zotero.getMainWindows();
        for (let win of windows)
        {
            if(!win.ZoteroPane) continue;
            win.document.getElementById(this.move_selected_item_id).setAttribute('data-l10n-id', 'zotmoov-context-move-selected');
            win.document.getElementById(this.move_selected_item_custom_id).setAttribute('data-l10n-id', 'zotmoov-context-move-selected-custom-dir');
        }
    },

    setCopy()
    {
        let windows = Zotero.getMainWindows();
        for (let win of windows)
        {
            if(!win.ZoteroPane) continue;
            win.document.getElementById(this.move_selected_item_id).setAttribute('data-l10n-id', 'zotmoov-context-copy-selected');
            win.document.getElementById(this.move_selected_item_custom_id).setAttribute('data-l10n-id', 'zotmoov-context-copy-selected-custom-dir');
        }
    },

    unload(win)
    {
        let doc = win.document;

        win.document.getElementById(this.menuseparator_id).remove();
        win.document.getElementById(this.move_selected_item_id).remove();
        win.document.getElementById(this.move_selected_item_custom_id).remove();
        doc.querySelector('[href="zotmoov.ftl"]').remove();

        let zotero_itemmenu = doc.getElementById('zotero-itemmenu');
        zotero_itemmenu.removeEventListener('popupshowing', this._popupShowing);
    },

    loadAll()
    {
        let windows = Zotero.getMainWindows();
        for (let win of windows)
        {
            if(!win.ZoteroPane) continue;
            this.load(win);
        }
    },

    unloadAll()
    {
        let windows = Zotero.getMainWindows();
        for (let win of windows)
        {
            if(!win.ZoteroPane) continue;
            this.unload(win);
        }
    },
}

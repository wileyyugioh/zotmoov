// ZotMoov
// zotmoov_menus.js
// Written by Wiley Yu

ZotMoov_Menus = {
    _store_added_elements: [],

    _getWindow()
    {
        var enumerator = Services.wm.getEnumerator("navigator:browser");
        while (enumerator.hasMoreElements()) {
            let win = enumerator.getNext();
            if (!win.ZoteroPane) continue;
            return win;
        }
    },

    init()
    {
        let win = this._getWindow();
        let doc = win.document;

        // Menu separator
        let menuseparator = doc.createXULElement('menuseparator');

        // Move Selected Menu item
        let move_selected_item = doc.createXULElement('menuitem');
        move_selected_item.id = 'zotmoov-context-move-selected';
        move_selected_item.setAttribute('data-l10n-id', 'zotmoov-context-move-selected');
        move_selected_item.addEventListener('command', () => {
            Zotero.ZotMoov.moveSelectedItems();
        });

        // Custom Dir Menu item
        let move_selected_item_custom = doc.createXULElement('menuitem');
        move_selected_item_custom.id = 'zotmoov-context-move-selected-custom-dir';
        move_selected_item_custom.setAttribute('data-l10n-id', 'zotmoov-context-move-selected-custom-dir');
        move_selected_item_custom.hidden = !Zotero.Prefs.get('extensions.zotmoov.enable_custom_dir', true);
        move_selected_item_custom.addEventListener('command', () => {
            Zotero.ZotMoov.moveSelectedItemsCustomDir();
        });

        let zotero_itemmenu = doc.getElementById('zotero-itemmenu');
        zotero_itemmenu.appendChild(menuseparator);
        zotero_itemmenu.appendChild(move_selected_item);
        zotero_itemmenu.appendChild(move_selected_item_custom);

        this._store_added_elements.push(menuseparator, move_selected_item, move_selected_item_custom);

        // Enable localization
        win.MozXULElement.insertFTLIfNeeded('zotmoov.ftl');
    },

    destroy()
    {
        let doc = this._getWindow().document;
        for (let element of this._store_added_elements)
        {
            if (element) element.remove();
        }
        doc.querySelector('[href="zotmoov.ftl"]').remove();
    }
}
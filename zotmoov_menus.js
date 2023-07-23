// ZotMoov
// zotmoov_menus.js
// Written by Wiley Yu

Components.utils.import('resource://gre/modules/Services.jsm');

ZotMoov_Menus = {
    _store_added_elements: [],
    _opt_disable_elements: [],

    _window_listener:
    {
        onOpenWindow: function(a_window)
        {
            let dom_window = a_window.QueryInterface(Ci.nsIInterfaceRequestor).getInterface(Ci.nsIDOMWindow);
            dom_window.addEventListener('load', function()
            {
                dom_window.removeEventListener('load', arguments.callee, false);
                if (dom_window.document.documentElement.getAttribute('windowtype') != 'navigator:browser') return;
                ZotMoov_Menus._store_added_elements = []; // Clear tracked elements since destroyed by closed window
                ZotMoov_Menus._opt_disable_elements = [];
                ZotMoov_Menus._init();
            }, false);
        }
    },

    _popupShowing()
    {
        let should_disabled = !ZotMoov_Menus._hasAttachments();
        for (let element of ZotMoov_Menus._opt_disable_elements)
        {
            element.disabled = should_disabled;
        }
    },

    _getWindow()
    {
        let enumerator = Services.wm.getEnumerator('navigator:browser');
        while (enumerator.hasMoreElements())
        {
            let win = enumerator.getNext();
            if (!win.ZoteroPane) continue;
            return win;
        }
    },

    _hasAttachments()
    {
        let items = Zotero.ZotMoov._getSelectedItems();
        return (items.size != 0);
    },

    init()
    {
        this._init();
        Services.wm.addListener(this._window_listener);
    },

    _init()
    {
        let win = this._getWindow();
        let doc = win.document;

        // Menu separator
        let menuseparator = doc.createXULElement('menuseparator');

        // Move Selected Menu item
        let move_selected_item = doc.createXULElement('menuitem');
        move_selected_item.id = 'zotmoov-context-move-selected';
        move_selected_item.setAttribute('data-l10n-id', 'zotmoov-context-move-selected');
        move_selected_item.addEventListener('command', function()
        {
            Zotero.ZotMoov.moveSelectedItems();
        });

        // Custom Dir Menu item
        let move_selected_item_custom = doc.createXULElement('menuitem');
        move_selected_item_custom.id = 'zotmoov-context-move-selected-custom-dir';
        move_selected_item_custom.setAttribute('data-l10n-id', 'zotmoov-context-move-selected-custom-dir');
        move_selected_item_custom.hidden = !Zotero.Prefs.get('extensions.zotmoov.enable_custom_dir', true);
        move_selected_item_custom.addEventListener('command', function()
        {
            Zotero.ZotMoov.moveSelectedItemsCustomDir();
        });

        let zotero_itemmenu = doc.getElementById('zotero-itemmenu');
        zotero_itemmenu.addEventListener('popupshowing', this._popupShowing);

        zotero_itemmenu.appendChild(menuseparator);
        zotero_itemmenu.appendChild(move_selected_item);
        zotero_itemmenu.appendChild(move_selected_item_custom);

        this._store_added_elements.push(menuseparator, move_selected_item, move_selected_item_custom);
        this._opt_disable_elements.push(move_selected_item, move_selected_item_custom);

        // Enable localization
        win.MozXULElement.insertFTLIfNeeded('zotmoov.ftl');
    },

    destroy()
    {
        this._destroy();
        Services.wm.removeListener(this._window_listener);
    },

    _destroy()
    {
        let doc = this._getWindow().document;
        for (let element of this._store_added_elements)
        {
            if (element) element.remove();
        }
        doc.querySelector('[href="zotmoov.ftl"]').remove();

        let zotero_itemmenu = doc.getElementById('zotero-itemmenu');
        zotero_itemmenu.removeEventListener('popupshowing', this._popupShowing);

        this._store_added_elements = [];
        this._opt_disable_elements = [];
    }
}

// ZotMoov
// zotmoov_menus.js
// Written by Wiley Yu

Components.utils.import('resource://gre/modules/Services.jsm');

Zotero.ZotMoov.Menus = {
    _store_added_elements: [],
    _move_selected_item: null,
    _move_selected_item_custom: null,

    _window_listener:
    {
        onOpenWindow: function(a_window)
        {
            let dom_window = a_window.QueryInterface(Ci.nsIInterfaceRequestor).getInterface(Ci.nsIDOMWindow);
            dom_window.addEventListener('load', function()
            {
                dom_window.removeEventListener('load', arguments.callee, false);
                if (dom_window.document.documentElement.getAttribute('windowtype') != 'navigator:browser') return;
                Zotero.ZotMoov.Menus._store_added_elements = []; // Clear tracked elements since destroyed by closed window
                Zotero.ZotMoov.Menus._move_selected_item = null;
                Zotero.ZotMoov.Menus._move_selected_item_custom = null;
                Zotero.ZotMoov.Menus._init();
            }, false);
        }
    },

    _popupShowing()
    {
        let should_disabled = !this._hasAttachments();
        this._move_selected_item.disabled = should_disabled;
        this._move_selected_item_custom.disabled = should_disabled;
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
        this._move_selected_item = doc.createXULElement('menuitem');
        this._move_selected_item.id = 'zotmoov-context-move-selected';
        this._move_selected_item.addEventListener('command', function()
        {
            Zotero.ZotMoov.moveSelectedItems();
        });

        // Custom Dir Menu item
        this._move_selected_item_custom = doc.createXULElement('menuitem');
        this._move_selected_item_custom.id = 'zotmoov-context-move-selected-custom-dir';
        this._move_selected_item_custom.hidden = !Zotero.Prefs.get('extensions.zotmoov.enable_custom_dir', true);
        this._move_selected_item_custom.addEventListener('command', function()
        {
            Zotero.ZotMoov.moveSelectedItemsCustomDir();
        });

        let zotero_itemmenu = doc.getElementById('zotero-itemmenu');
        zotero_itemmenu.addEventListener('popupshowing', this._popupShowing.bind(this));

        zotero_itemmenu.appendChild(menuseparator);
        zotero_itemmenu.appendChild(this._move_selected_item);
        zotero_itemmenu.appendChild(this._move_selected_item_custom);

        this._store_added_elements.push(menuseparator, this._move_selected_item, this._move_selected_item_custom);

        if(Zotero.Prefs.get('extensions.zotmoov.no_copy', true) == 'move')
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
        this._move_selected_item.setAttribute('data-l10n-id', 'zotmoov-context-move-selected');
        this._move_selected_item_custom.setAttribute('data-l10n-id', 'zotmoov-context-move-selected-custom-dir');
    },

    setCopy()
    {
        this._move_selected_item.setAttribute('data-l10n-id', 'zotmoov-context-copy-selected');
        this._move_selected_item_custom.setAttribute('data-l10n-id', 'zotmoov-context-copy-selected-custom-dir');
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
        this._move_selected_item = null;
        this._move_selected_item_custom = null;
    }
}

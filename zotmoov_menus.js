// ZotMoov
// zotmoov_menus.js
// Written by Wiley Yu

ZotMoov_Menus = {
    _store_added_elements: [],

    _getWindow()
    {
        var enumerator = Services.wm.getEnumerator("navigator:browser");
        var window = null;
        while (enumerator.hasMoreElements()) {
            let win = enumerator.getNext();
            if (!win.ZoteroPane) continue;
            window = win;
        }
        return window;
    },

    init()
    {
        let win = this._getWindow()
        let doc = win.document;
        // createElementNS() necessary in Zotero 6; createElement() defaults to HTML in Zotero 7
        let HTML_NS = "http://www.w3.org/1999/xhtml";
        let XUL_NS = "http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul";

        // Menu separator
        let menuseparator = doc.createElementNS(XUL_NS, 'menuseparator');

        // Menu item
        let move_selected_item = doc.createElementNS(XUL_NS, 'menuitem');
        move_selected_item.id = 'zotmoov-context-move-selected';
        move_selected_item.setAttribute('data-l10n-id', 'zotmoov-context-move-selected');
        move_selected_item.onclick = Zotero.ZotMoov.moveSelectedItems();

        let zotero_itemmenu = doc.getElementById('zotero-itemmenu');
        zotero_itemmenu.appendChild(menuseparator);
        zotero_itemmenu.appendChild(move_selected_item);
        this._store_added_elements.push(menuseparator, move_selected_item);

        // Enable localization
        win.MozXULElement.insertFTLIfNeeded('zotmoov.ftl');
    },

    destroy()
    {
        let win = this._getWindow()
        let doc = win.document;
        for (let element of this._store_added_elements)
        {
            if (element) element.remove();
        }
        doc.querySelector('[href="zotmoov.ftl"]').remove();
    }
}
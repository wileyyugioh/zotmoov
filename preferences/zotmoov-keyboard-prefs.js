class ZotMoovKeyboardPrefs {

    static get BOUND_KEYS()
    {
        return [
            Zotero.Prefs.get('extensions.zotero.keys.saveToZotero', true),
            Zotero.Prefs.get('extensions.zotero.keys.newItem', true),
            Zotero.Prefs.get('extensions.zotero.keys.newNote', true),
            Zotero.Prefs.get('extensions.zotero.keys.library', true),
            Zotero.Prefs.get('extensions.zotero.keys.quicksearch', true),
            Zotero.Prefs.get('extensions.zotero.keys.copySelectedItemCitationsToClipboard', true),
            Zotero.Prefs.get('extensions.zotero.keys.copySelectedItemsToClipboard', true),
            Zotero.Prefs.get('extensions.zotero.keys.sync', true),
            Zotero.Prefs.get('extensions.zotero.keys.toggleAllRead', true),
            Zotero.Prefs.get('extensions.zotero.keys.toggleRead', true)
        ];
    }

    init()
    {
        this._warned_pref = new Set();

        for (let label of document.querySelectorAll('#zotmoov-kb-settings-sc-grid .modifier'))
        {
            // Display the appropriate modifier keys for the platform
            label.textContent = Zotero.isMac ? Zotero.getString('general.keys.cmdShift') : Zotero.getString('general.keys.ctrlShift');
        }

        for (let textbox of document.querySelectorAll('#zotmoov-kb-settings-sc-grid input'))
        {
            textbox.value = textbox.value.toUpperCase();
            textbox.addEventListener('syncfrompreference', () =>
            {
                const pref = textbox.getAttribute('preference');
                const val = Zotero.Prefs.get(pref, true).toUpperCase();
                textbox.value = val || '';

                const zm_keys_overlap = Array.from(document.querySelectorAll('#zotmoov-kb-settings-sc-grid input'))
                    .filter((tb) => tb.getAttribute('preference') != pref && tb.value == textbox.value);
                
                Zotero.ZotMoov.Menus.rebindPrefToKey(pref, textbox.value);

                if (textbox.value != '' && (this.constructor.BOUND_KEYS.includes(textbox.value) || zm_keys_overlap.length))
                {
                    this._warned_pref.add(pref);
                    this.addWarningTooltip(textbox.parentElement);
                    return;
                }

                this._warned_pref.delete(pref);
                this.clearWarningTooltip(textbox.parentElement);
            });
            textbox.addEventListener('input', () =>
            {
                const pref = textbox.getAttribute('preference');
                textbox.value = textbox.value.toUpperCase();

                const zm_keys_overlap = Array.from(document.querySelectorAll('#zotmoov-kb-settings-sc-grid input'))
                    .filter((tb) => tb.getAttribute('preference') != pref && tb.value == textbox.value);

                Zotero.ZotMoov.Menus.rebindPrefToKey(pref, textbox.value);
                if (textbox.value != '' && (this.constructor.BOUND_KEYS.includes(textbox.value) || zm_keys_overlap.length))
                {
                    this._warned_pref.add(pref);
                    this.addWarningTooltip(textbox.parentElement);
                    return;
                }

                this._warned_pref.delete(pref);
                this.clearWarningTooltip(textbox.parentElement);
            });
        }
    }

    addWarningTooltip(element)
    {
        element.style.color = 'red';
        document.getElementById('zotmoov-kb-settings-warning').style.display = '';
    }

    clearWarningTooltip(element)
    {
        element.style.color = '';
        if(this._warned_pref.size > 0) return;
        document.getElementById('zotmoov-kb-settings-warning').style.display = 'none';
    }
}

// Expose to Zotero
Zotero.ZotMoov.Prefs.Keyboard = new ZotMoovKeyboardPrefs();
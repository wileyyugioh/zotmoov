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
        this._zotero_bound_keys = this.constructor.BOUND_KEYS;

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
                let pref = textbox.getAttribute('preference');
                const val = Zotero.Prefs.get(pref, true).toUpperCase();
                textbox.value = val || '';
                
                Zotero.ZotMoov.Menus.rebindPrefToKey(textbox.getAttribute('preference'), textbox.value);
                if (this._zotero_bound_keys.includes(textbox.value))
                {
                    this.constructor.addWarningTooltip(textbox.parentElement.parentElement);
                } else
                {

                }
            });
            textbox.addEventListener('input', () =>
            {
                textbox.value = textbox.value.toUpperCase();
                Zotero.ZotMoov.Menus.rebindPrefToKey(textbox.getAttribute('preference'), textbox.value);
                if (this._zotero_bound_keys.includes(textbox.value))
                {
                    this.constructor.addWarningTooltip(textbox.parentElement.parentElement);
                } else
                {

                }
            });
        }
    }

    static addWarningTooltip(element)
    {
        element.style.color = 'red';
        element.title = 'Warning!!!!';
    }
}

// Expose to Zotero
Zotero.ZotMoov.Prefs.Keyboard = new ZotMoovKeyboardPrefs();
class ZotMoovKeyboardPrefs {
    init()
    {
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
            });
            textbox.addEventListener('input', () =>
            {
                textbox.value = textbox.value.toUpperCase();
                Zotero.ZotMoov.Menus.rebindPrefToKey(textbox.getAttribute('preference'), textbox.value);
            });
        }
    }
}

// Expose to Zotero
Zotero.ZotMoov.Prefs.Keyboard = new ZotMoovKeyboardPrefs();
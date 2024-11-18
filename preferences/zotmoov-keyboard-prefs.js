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

        for (let textbox of document.querySelectorAll('#zotmoov-kb-settings-sc-grid input'))
        {
            this._loadListeners(textbox);
        }

        for (let label of document.querySelectorAll('#zotmoov-kb-settings-sc-grid .modifier'))
        {
            // Display the appropriate modifier keys for the platform
            label.textContent = Zotero.isMac ? Zotero.getString('general.keys.cmdShift') : Zotero.getString('general.keys.ctrlShift');
        }

        this._loadAllCustomMenuItems();

        this._pref_obs = Zotero.Prefs.registerObserver('extensions.zotmoov.custom_menu_items', () => {
            document.getElementById('zotmoov-kb-settings-custom').innerHTML = '';
            this._loadAllCustomMenuItems(document);
        }, true);

        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState == 'hidden') Zotero.Prefs.unregisterObserver(this._pref_obs);
        })
    }

    _loadListeners(textbox)
    {
        if (textbox.value) textbox.value = textbox.value.toUpperCase();
        textbox.addEventListener('syncfrompreference', () =>
        {
            const pref = textbox.getAttribute('preference');
            const val = Zotero.Prefs.get(pref, true);
            if (val == undefined) return;
            textbox.value = val.toUpperCase() || '';

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

    _loadAllCustomMenuItems()
    {
        let cmus = JSON.parse(Zotero.Prefs.get('extensions.zotmoov.custom_menu_items', true));
        for (let key of Object.keys(cmus))
        {
            this._loadCustomMenuItem(key.replace(/\s/g, '_'), key);
        }
    }

    _loadCustomMenuItem(pref, name)
    {
        const PREF_PREFIX = 'extensions.zotmoov.keys.custom.';
        const pref_str = PREF_PREFIX + pref;

        if (Zotero.Prefs.get(pref_str, true) == undefined) Zotero.Prefs.set(pref_str, '', true);

        const hbox = document.createXULElement('hbox');
        hbox.setAttribute('align', 'center');
        hbox.setAttribute('pack', 'end');

        const label = document.createXULElement('label');
        label.setAttribute('data-l10n-id', 'zotmoov-kb-settings-custom');
        label.setAttribute('data-l10n-args', `{ "text": "${ name }" }`);

        const spacer = document.createXULElement('spacer');
        spacer.setAttribute('flex', '1');

        const modifier = document.createElement('label');
        modifier.classList.add('modifier');
        modifier.textContent = Zotero.isMac ? Zotero.getString('general.keys.cmdShift') : Zotero.getString('general.keys.ctrlShift');

        const text = document.createElement('input');
        text.setAttribute('type', 'text');
        text.setAttribute('maxlength', '1');
        text.setAttribute('size', '1');
        text.setAttribute('preference', pref_str);

        hbox.appendChild(label);
        hbox.appendChild(spacer);
        hbox.appendChild(modifier);
        hbox.appendChild(text);

        document.getElementById('zotmoov-kb-settings-custom').appendChild(hbox);

        this._loadListeners(text);
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
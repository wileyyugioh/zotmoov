// ZotMoov
// zotmoov_prefs.js
// Written by Wiley Yu

Zotero.ZotMoov.Prefs =
{
    init()
    {
        let enable_subdir_move = Zotero.Prefs.get('extensions.zotmoov.enable_subdir_move', true);
        document.getElementById('zotmoov-subdir-str').disabled = !enable_subdir_move;
    },

    async pickDirectory()
    {
        let fp = Components.classes['@mozilla.org/filepicker;1'].createInstance(Components.interfaces.nsIFilePicker);

        fp.init(window, Zotero.getString('dataDir.selectDir'), fp.modeGetFolder);
        fp.appendFilters(fp.filterAll);
        let rv = await new Zotero.Promise(function(resolve)
        {
            fp.open((returnConstant) => resolve(returnConstant));
        });
        if (rv != fp.returnOK) return '';

        Zotero.Prefs.set('extensions.zotmoov.dst_dir', fp.file.path, true);
        document.getElementById('zotmoov-dst-dir').value = fp.file.path;
    },

    onCustomDirClick(cb)
    {
        let enumerator = Services.wm.getEnumerator('navigator:browser');
        while (enumerator.hasMoreElements())
        {
            let win = enumerator.getNext();
            if (!win.ZoteroPane) continue;

            win.document.getElementById('zotmoov-context-move-selected-custom-dir').hidden = cb.checked;
        }
    },

    onSubDirClick(cb)
    {
        document.getElementById('zotmoov-subdir-str').disabled = !cb.checked;
    },

    updateMenuItems(item)
    {
        let v = item.value;
        if(v == 'move')
        {
            Zotero.ZotMoov.Menus.setMove();
        } else
        {
            Zotero.ZotMoov.Menus.setCopy();
        }
    }
};

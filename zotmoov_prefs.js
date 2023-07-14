// ZotMoov
// zotmoov_prefs.js
// Written by Wiley Yu

Zotero.ZotMoov_Prefs =
{
    init()
    {
        document.getElementById('zotmoov-dst-dir').value = Zotero.Prefs.get('extensions.zotmoov.dst_dir');
    },

    async pickDirectory()
    {
        var FilePicker = require('zotero/modules/filePicker').default;
        var fp = new FilePicker();
        var wm = Services.wm;
        var win = wm.getMostRecentWindow('navigator:browser');

        fp.init(win, Zotero.getString('dataDir.selectDir'), fp.modeGetFolder);
        fp.appendFilters(fp.filterAll);
        if (await fp.show() != fp.returnOK) return '';

        Zotero.Prefs.set('extensions.zotmoov.dst_dir', fp.file);
        document.getElementById('zotmoov-dst-dir').value = fp.file;
    },

    toggleShowCustomDir(cb)
    {
        document.getElementById('zotmoov-context-move-selected-custom-dir').style.display = cb.checked;
    }
};
// ZotMoov
// zotmoov.js
// Written by Wiley Yu


// If this doesn't load, fail anyways
Components.utils.importGlobalProperties(['PathUtils', 'IOUtils']);

Zotero.ZotMoov =
{
    id: null,
    version: null,
    rootURI: null,
    initialized: false,

    _track_add: null,
    _notifierID: null,

    init({ id, version, rootURI })
    {
        if(this.initialized) return;

        this.id = id;
        this.version = version;
        this.rootURI = rootURI;
        this.initialized = true;
        this._notifierID = Zotero.Notifier.registerObserver(this.notifyCallback, ['item'], 'zotmoov', 99);

        var window = null;
        var enumerator = Services.wm.getEnumerator("navigator:browser");
        while (enumerator.hasMoreElements()) {
            let win = enumerator.getNext();
            if (!win.ZoteroPane) continue;
            window = win;
        }

        // Unregister callback when the window closes (important to avoid a memory leak)
        window.addEventListener('unload', function(e) {
                Zotero.Notifier.unregisterObserver(this._notifierID);
        }, false);
    },

    destroy()
    {
        Zotero.Notifier.unregisterObserver(this._notifierID);
    },

    move: async function(items, dst_path, options = { ignore_linked: true })
    {
        if (dst_path == '') return;

        for (let item of items)
        {
            if (item.isRegularItem()) continue;
            if (options.ignore_linked && (item.attachmentLinkMode != Zotero.Attachments.LINK_MODE_IMPORTED_FILE)) continue;

            let file_path = item.getFilePath();
            let file_name = file_path.split(/[\\/]/).pop();
            let copy_path = PathUtils.join(dst_path, file_name);

            // Have to check since later adding an entry triggers the
            // handler again
            if (file_path == copy_path) continue;

            let clone = null;
            if (options.ignore_linked)
            {
                // If dragged and dropped from 
                item.attachmentLinkMode = Zotero.Attachments.LINK_MODE_LINKED_FILE;
                item.attachmentPath = copy_path;
            } else 
            {
                // If later transfered via menus/etc.
                clone = item.clone()
                clone.attachmentLinkMode = Zotero.Attachments.LINK_MODE_LINKED_FILE;
                clone.attachmentPath = copy_path;
                clone.setCollections(item.getCollections()); // This isn't cloned

                item.deleted = true;
            }

            // Just overwrite the file if it exists
            IOUtils.move(file_path, copy_path).then(function()
            {
                if(clone) clone.saveTx();
                item.saveTx(); // Only save after copied
            });
        }
    },

    _getSelectedItems: function()
    {
        let items = Zotero.getActiveZoteroPane().getSelectedItems();
        let att_ids = [];
        let atts = new Set();
        for (let item of items)
        {
            if (!item.isRegularItem())
            {
                atts.add(item);
                continue;
            }

            att_ids.push(...item.getAttachments());
        }

        let new_atts = Zotero.Items.get(att_ids);
        new_atts.forEach(att => atts.add(att));

        return atts
    },

    moveSelectedItems: async function()
    {
        let atts = this._getSelectedItems();

        let dst_path = Zotero.Prefs.get('extensions.zotmoov.dst_dir', true);
        return this.move(atts, dst_path, { ignore_linked: false });
    },

    moveSelectedItemsCustomDir: async function()
    {
        let atts = this._getSelectedItems();

        var fp = Components.classes["@mozilla.org/filepicker;1"].createInstance(Components.interfaces.nsIFilePicker);
        var wm = Services.wm;
        var win = wm.getMostRecentWindow('navigator:browser');

        fp.init(win, Zotero.getString('dataDir.selectDir'), fp.modeGetFolder);
        fp.appendFilters(fp.filterAll);
        var rv = await new Zotero.Promise(function (resolve)
        {
            fp.open((returnConstant) => resolve(returnConstant));
        });
        if (rv != fp.returnOK) return '';

        return this.move(atts, fp.file.path, { ignore_linked: false });
    },

    notifyCallback:
    {
        addCallback: async function(event, ids, extraData)
        {
            let auto_move = Zotero.Prefs.get('extensions.zotmoov.enable_automove', true);
            if (!auto_move) return;

            let items = Zotero.Items.get(ids);
            let dst_path = Zotero.Prefs.get('extensions.zotmoov.dst_dir', true);
            Zotero.ZotMoov.move(items, dst_path);
        },

        notify: async function(event, type, ids, extraData)
        {
            if (event == 'add') this.addCallback(event, ids, extraData);
        },
    },
};
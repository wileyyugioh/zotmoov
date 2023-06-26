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

    init({ id, version, rootURI })
    {
        if(this.initialized) return;

        this.id = id;
        this.version = version;
        this.rootURI = rootURI;
        this.initialized = true;
        this._track_add = new Set();

        let notifierID = Zotero.Notifier.registerObserver(this.notifyCallback, ['item'], 'zotmoov');

        var window = null;
        var enumerator = Services.wm.getEnumerator("navigator:browser");
        while (enumerator.hasMoreElements()) {
            let win = enumerator.getNext();
            if (!win.ZoteroPane) continue;
            window = win;
        }

        // Unregister callback when the window closes (important to avoid a memory leak)
        window.addEventListener('unload', function(e) {
                Zotero.Notifier.unregisterObserver(notifierID);
        }, false);
    },

    async _copyFile(file_path, dst_path)
    {
        // Check to make sure file exists
        Zotero.log(dst_path)
        Zotero.log(file_path);
        if (!(await IOUtils.exists(file_path))) throw("ZotMoov: File does not exist");
        IOUtils.copy(file_path, dst_path); // Just overwrite the file if it exists
    },

    async _copyAndLink(ref_item, att_item, file_path, dst_path, filename)
    {
        await this._copyFile(file_path, dst_path)

        var att = new Zotero.Item('attachment');

        att.title = filename;
        att.attachmentLinkMode = Zotero.Attachments.LINK_MODE_LINKED_FILE;
        att.attachmentPath = dst_path;
        att.attachmentContentType = att_item.attachmentContentType;
        att.parentID = ref_item.id;
        att.saveTx();
    },

    notifyCallback:
    {
         addCallback: async function(event, ids, extraData)
        {
            let items = Zotero.Items.get(ids);
            for (let item of items)
            {
                Zotero.log(JSON.stringify(Zotero.ZotMoov._track_ignore));
                if (item.isRegularItem()) continue;

                Zotero.log('Add');
                Zotero.ZotMoov._track_add.add(item.id);
            }
        },

        modifyCallback: async function(event, ids, extraData)
        {
            let items = Zotero.Items.get(ids);
            for (let item of items)
            {
                if (item.isRegularItem()) continue;
                if (!item.parentID) continue;
                if (!Zotero.ZotMoov._track_add.delete(item.id)) continue;

                // We found an id that has been added and is an attachment and has a reference

                let dst_path = Zotero.Prefs.get('extensions.zotmoov.dst_dir', '')
                if (dst_path == '') continue;
                if (item.attachmentContentType != 'application/pdf'
                    && item.attachmentContentType != 'text/html') continue;

                let ref_item = Zotero.Items.get(item.parentID);

                let file_path = item.getFilePath();
                let file_name = file_path.split(/[\\/]/).pop();
                let copy_path = PathUtils.join(dst_path, file_name);

                if (file_path == copy_path) continue;

                await Zotero.ZotMoov._copyAndLink(ref_item, item, file_path, copy_path, file_name);

                item.deleted = true;
                await item.saveTx();
            }
        },

        notify: async function(event, type, ids, extraData)
        {
            Zotero.log("Notified");
            Zotero.log(event);
            Zotero.log(ids);
            Zotero.log(JSON.stringify(extraData));
            if (event == 'add') this.addCallback(event, ids, extraData);
            if (event == 'modify') this.modifyCallback(event, ids, extraData);
        },
    },
}
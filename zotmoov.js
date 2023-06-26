// ZotMoov
// zotmoov.js
// Written by Wiley Yu

ZotMoov = {
    id: null,
    version: null,
    rootURI: null,
    initialized: false,

    init({ id, version, rootURI })
    {
        if(this.initialized) return;

        this.id = id;
        this.version = version;
        this.rootURI = rootURI;
        this.initialized = true;

        let notifierID = Zotero.Notifier.registerObserver(this.notifierCallback, ['item'], 'zotmoov')

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
        if (!(await IOUtils.exists(file_path))) throw("ZotMoov: File does not exist");
        IOUtils.copy(file_path, dst_path); // Just overwrite the file if it exists
    },

    _formattedFileName(item, file_base, file_ext)
    {
        if (Zotero.Prefs.get('extensions.zotmoov.enable_custom_filename', true))
        {
            let title = item.getField('title');
            let first_author_lst_name = item.getCreator(0).lastName;
            let date = item.getField('Date');

            return title + "_" + first_author_lst_name + "_" + date + file_ext;
        }

        return file_base + attachment_ext;
    },

    async _copyAndLink(item, file_path, dst_path, fmt_name)
    {
        await _copyFile(file_path, dst_path)

        var att = new Zotero.item('attachment');
        att.setField('attachmentLinkMode', Zotero.Attachments.LINK_MODE_LINKED_FILE);
        att.relinkAttachmentFile(dst_path);

        item.addRelatedItem(att);

        if (Zotero.Prefs.get('extensions.zotmoov.delete_file_after_copy', false))
        {
            IOUtils.remove(file_path);
        }
    },

    notifierCallback:
    {
        notify: async function(event, type, ids, extraData)
        {
            if (event != 'add') return;

            let dst_path = Zotero.Prefs.get('extensions.zotmoov.dst_dir', '')
            if (dst_path == '') return;

            let items = Zotero.Items.get(ids)
            for (let item of items)
            {
                if (!item.isRegularItem()) continue;
                let attachmentIDs = item.getAttachments();
                for (let attachmentID of attachmentIDs)
                {
                    let attachment = Zotero.Items.get(attachmentID);
                    if (attachment.attachmentContentType != 'application/pdf'
                        && attachment.attachmentContentType != 'text/html') return;
                    
                    let file_path = attachment.getFilePath();
                    let file_base = attachment_file_path.split(/[\\/]/).pop();
                    let file_ext = '.' + attachment_file_path.split('.').pop();

                    let fmt_name = _formattedFileName(item, file_base, file_ext)
                    let copy_path = PathUtils.join(dst_path, fmt_name);
                    _copyAndLink(item, file_path, copy_path, filename, fmt_name);
                }
            }
        }
    },
}
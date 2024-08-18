var ZotMoovNotifyCallback = class {
    constructor(zotmoov) {
        this._item_ids = [];
        this._ignore_keys = [];

        this._timeoutID = 0;
        this._syncDelayHandle = null;
        this._zotmoov = zotmoov;

        this._enabled = true;
    }

    enable() { this._enabled = true; }
    disable() { this._enabled = false; }

    // Ignore these keys during the next ZotMoov update
    addKeysToIgnore(keys)
    {
        this._ignore_keys.push(...keys);
    }

    reenableSync()
    {
        if(this._syncDelayHandle)
        {
            this._syncDelayHandle();
            this._syncDelayHandle = null;
        }
    }

    async execute() {
        let ids = this._item_ids.slice();
        let ignore_keys = this._ignore_keys.slice();

        if (ids.length == 0) return;

        let dst_path = Zotero.Prefs.get('extensions.zotmoov.dst_dir', true);
        let subfolder_enabled = Zotero.Prefs.get('extensions.zotmoov.enable_subdir_move', true);
        let subdir_str = Zotero.Prefs.get('extensions.zotmoov.subdirectory_string', true);
        let allowed_file_ext = JSON.parse(Zotero.Prefs.get('extensions.zotmoov.allowed_fileext', true));
        let rename_title = Zotero.Prefs.get('extensions.zotmoov.rename_title', true);

        // Pass null if empty
        allowed_file_ext = (allowed_file_ext.length) ? allowed_file_ext : null;

        let all_items = Zotero.Items.get(ids);
        let items = all_items.filter((i) => {
            return !(ignore_keys.includes(i.key));
        });

        if(Zotero.Prefs.get('extensions.zotmoov.file_behavior', true) == 'move')
        {
            await this._zotmoov.move(items, dst_path, 
            {
                into_subfolder: subfolder_enabled,
                subdir_str: subdir_str,
                allowed_file_ext: allowed_file_ext,
                preferred_collection: (Zotero.getActiveZoteroPane().getSelectedCollection() ? Zotero.getActiveZoteroPane().getSelectedCollection().id : null),
                rename_title: rename_title
            });
        } else
        {
            let allow_group_libraries = Zotero.Prefs.get('extensions.zotmoov.copy_group_libraries', true);
            await this._zotmoov.copy(items, dst_path,
            {
                into_subfolder: subfolder_enabled,
                subdir_str: subdir_str,
                allow_group_libraries: allow_group_libraries,
                allowed_file_ext: allowed_file_ext,
                preferred_collection: Zotero.getActiveZoteroPane().getSelectedCollection() ? Zotero.getActiveZoteroPane().getSelectedCollection().id : null
            });
        }

        for (let id of ids)
        {
            const index = this._item_ids.indexOf(id);
            if (index > -1) this._item_ids.splice(index, 1);
        }

        for (let key of ignore_keys)
        {
            const index = this._ignore_keys.indexOf(key);
            if (index > -1) this._ignore_keys.splice(index, 1);
        }

        this.reenableSync();
    }

    async addCallback(event, ids, extraData) {
        let auto_move = Zotero.Prefs.get('extensions.zotmoov.enable_automove', true);
        if (!auto_move || !this._enabled) return;

        // Disable syncing
        if (this._syncDelayHandle == null) this._syncDelayHandle = Zotero.Sync.Runner.delayIndefinite();

        this._item_ids.push(...ids);

        clearTimeout(this._timeoutID);
        this._timeoutID = setTimeout(this.execute.bind(this), Zotero.Prefs.get('extensions.zotmoov.auto_process_delay', true));
    }

    async modifyCallback(event, ids, extraData) {
        clearTimeout(this._timeoutID);
        this._timeoutID = setTimeout(this.execute.bind(this), Zotero.Prefs.get('extensions.zotmoov.auto_process_delay', true));
    }

    async notify(event, type, ids, extraData) {
        if (event == 'add') await this.addCallback(event, ids, extraData);
        if (event == 'modify') await this.modifyCallback(event, ids, extraData);
    }

    destroy()
    {
        clearTimeout(this._timeoutID);
        this._timeoutID = 0;

        this.reenableSync();
    }
}


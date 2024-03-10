class ZotmoovNotifyCallback {
    constructor(zotmoov) {
        this._item_ids = [];
        this._timeoutID = 0;
        this._zotmoov = zotmoov;
    }

    async execute() {
        let ids = this._item_ids;
        if (ids.length == 0) return;
        let dst_path = Zotero.Prefs.get('extensions.zotmoov.dst_dir', true);
        let subfolder_enabled = Zotero.Prefs.get('extensions.zotmoov.enable_subdir_move', true);
        let subdir_str = Zotero.Prefs.get('extensions.zotmoov.subdirectory_string', true);

        let items = Zotero.Items.get(ids);
        if(Zotero.Prefs.get('extensions.zotmoov.file_behavior', true) == 'move')
        {
            await this._zotmoov.move(items, dst_path, { into_subfolder: subfolder_enabled, subdir_str: subdir_str});
        } else
        {
            let allow_group_libraries = Zotero.Prefs.get('extensions.zotmoov.copy_group_libraries', true);
            await this._zotmoov.copy(items, dst_path, { into_subfolder: subfolder_enabled, subdir_str: subdir_str,
                allow_group_libraries: allow_group_libraries });
        }

        for (let id of ids)
        {
            const index = this._item_ids.indexOf(id);
            if (index > -1) this._item_ids.splice(index, 1);
        }
    }

    async addCallback(event, ids, extraData) {
        let auto_move = Zotero.Prefs.get('extensions.zotmoov.enable_automove', true);
        if (!auto_move) return;

        this._item_ids.push(...ids);
    }

    async modifyCallback(event, ids, extraData) {
        clearTimeout(this._timeoutID);
        this._timeoutID = setTimeout(this.execute, Zotero.Prefs.get('extensions.zotmoov.auto_process_delay', true));
    }

    async notify(event, type, ids, extraData) {
        if (event == 'add') await this.addCallback(event, ids, extraData);
        if (event == 'modify') await this.modifyCallback(event, ids, extraData);
    }
}

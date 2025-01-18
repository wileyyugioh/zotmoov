class ZotMoovNotifyCallback {
    constructor(zotmoov) {
        this._item_ids = [];
        this._ignore_keys = [];

        this._timeoutID = 0;
        this._syncDelayHandle = null;
        this._zotmoov = zotmoov;

        this._need_to_process = 0;
    }

    _needToProcess() { this._need_to_process++; }
    _freeToProcess() { this._need_to_process--; }

    async lock(func)
    {
        this._needToProcess();
        try
        {
            await func();
        }
        finally
        {
            this._freeToProcess();
        }
    }

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

    async _doExecute()
    {
        let ids = this._item_ids.slice();
        let ignore_keys = this._ignore_keys.slice();

        if (ids.length == 0) return;

        let dst_path = Zotero.Prefs.get('extensions.zotmoov.dst_dir', true);

        let all_items = Zotero.Items.get(ids);
        let items = all_items.filter((i) => {
            return !(ignore_keys.includes(i.key));
        });

        let pref = this._zotmoov.getBasePrefs();
        pref.ignore_linked = true;
        if(Zotero.Prefs.get('extensions.zotmoov.file_behavior', true) == 'move')
        {
            await this._zotmoov.move(items, dst_path, pref);
        } else
        {
            await this._zotmoov.copy(items, dst_path, pref);
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

    async execute() {
        if (this._need_to_process > 0)
        {
            clearTimeout(this._timeoutID);
            this._timeoutID = setTimeout(this.execute.bind(this), Zotero.Prefs.get('extensions.zotmoov.auto_process_delay', true));
            return;
        }

        await this.lock(this._doExecute.bind(this));
    }

    async addCallback(event, ids, extraData) {
        let auto_move = Zotero.Prefs.get('extensions.zotmoov.enable_automove', true);
        if (!auto_move) return;

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


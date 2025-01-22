var ZotMoovBindings = class {
    constructor(zotmoov)
    {
        this._zotmoov = zotmoov;
        this._callback = new ZotMoovNotifyCallback(zotmoov);
        this._patcher = new ZotMoovPatcher();

        this._notifierID = Zotero.Notifier.registerObserver(this._callback, ['item'], 'zotmoov', 100);
        
        this._orig_funcs = [];
        this._del_ignore = [];

        this.lock = this._callback.lock.bind(this._callback);

        let self = this;
        this._patcher.monkey_patch(Zotero.Attachments, 'convertLinkedFileToStoredFile', function (orig) {
            return async function(...args)
            {
                let ret = null;
                await self._callback.lock(async () =>
                {
                    ret = await orig.apply(this, args);
                    self.ignoreAdd([ret.key]);
                });

                return ret;
            };
        });

        this._patcher.monkey_patch(Zotero.Item.prototype, '_eraseData', function (orig) {
            return Zotero.Promise.coroutine(function* (...args) {
                let val = yield orig.apply(this, args);

                // If file in the ignore list skip the deletion
                if (self._del_ignore.includes(this.key)) return val;

                if (Zotero.Prefs.get('extensions.zotmoov.delete_files', true))
                {
                    let prune_empty_dir = Zotero.Prefs.get('extensions.zotmoov.prune_empty_dir', true);
                    self._zotmoov.delete([this], Zotero.Prefs.get('extensions.zotmoov.dst_dir', true), { prune_empty_dir: prune_empty_dir });
                }

                return val;
            });
        });

        // We do not want to delete the linked files upon sync
        // So we have to do this complicated stuff to preprocess the deleted files
        this._patcher.monkey_patch(Zotero.Sync.APIClient.prototype, 'getDeleted', function (orig) {
            return Zotero.Promise.coroutine(function* (libraryType, ...other) {
                let results = yield orig.apply(this, [libraryType, ...other]);

                // Sometimes when syncing _eraseData can be called twice
                // Once when the parent item is deleted, and another time when the child attachment is deleted
                self._del_ignore = [];

                // Linked files only exist in user library
                if (libraryType != 'user') return results;
                if (!Zotero.Prefs.get('extensions.zotmoov.delete_files', true)) return results;
                if (!Zotero.Prefs.get('extensions.zotmoov.process_synced_files', true)) return results;

                for (let key of results.deleted['items'])
                {
                    let obj = Zotero.Items.getByLibraryAndKey(Zotero.Libraries.userLibraryID, key);
                    if (!obj || !obj.isFileAttachment() || obj.attachmentLinkMode != Zotero.Attachments.LINK_MODE_LINKED_FILE) continue;

                    // Add to ignore list
                    self._del_ignore.push(key);
                }


                return results;
            });
        });

        // Don't process new files that are added
        this._patcher.monkey_patch(Zotero.Sync.Data.Local, '_saveObjectFromJSON', function (orig) {
            return Zotero.Promise.coroutine(function* (...args) {
                let results = yield orig.apply(this, [...args]);

                // ...unless the user wants it
                if (!Zotero.Prefs.get('extensions.zotmoov.process_synced_files', true)) return results;

                if(results.processed) self._callback.addKeysToIgnore([results.key]);

                return results;
            });
        });
    }

    ignoreAdd(keys)
    {
        this._callback.addKeysToIgnore(keys);
    }

    destroy()
    {
        Zotero.Notifier.unregisterObserver(this._notifierID);
        this._callback.destroy();
        this._patcher.disable();
    }
}

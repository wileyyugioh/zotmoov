var ZotMoovBindings = class {
    constructor(zotmoov)
    {
        this._zotmoov = zotmoov;
        this._callback = new ZotMoovNotifyCallback(zotmoov);

        this._notifierID = Zotero.Notifier.registerObserver(this._callback, ['item'], 'zotmoov', 100);
        
        this._disabled = false;
        this._orig_funcs = [];

        let self = this;
        this._monkey_patch(Zotero.Attachments, 'convertLinkedFileToStoredFile', function (orig) {
            return async function(item, options = {}, ...other)
            {
                self._callback.disable();
                let ret = await orig.apply(this, [item, options, ...other]);
                self._callback.enable();

                return ret;
            }
        });

        let orig_erase_data = this._monkey_patch(Zotero.Item.prototype, '_eraseData', function (orig) {
            return Zotero.Promise.coroutine(function* (env, ...other) {
                return orig.apply(this, [env, ...other]).then((val) =>
                {
                    if (Zotero.Prefs.get('extensions.zotmoov.delete_files', true))
                    {
                        let prune_empty_dir = Zotero.Prefs.get('extensions.zotmoov.prune_empty_dir', true);

                        self._zotmoov.delete([this], Zotero.Prefs.get('extensions.zotmoov.dst_dir', true), { prune_empty_dir: prune_empty_dir });
                    }

                    return val;
                });
            });
        });

        // We do not want to delete the linked files upon sync
        // So we have to do this complicated stuff to preprocess the deleted files
        this._monkey_patch(Zotero.Sync.APIClient.prototype, 'getDeleted', function (orig) {
            return Zotero.Promise.coroutine(function* (libraryType, libraryTypeID, since, ...other) {
                let results = yield orig.apply(this, [libraryType, libraryTypeID, since, ...other]);

                // Linked files only exist in user library
                if (libraryType != 'user' || !Zotero.Prefs.get('extensions.zotmoov.delete_files', true)) return results;

                let new_delete = []
                for (let key of results.deleted['items'])
                {
                    let obj = Zotero.Items.getByLibraryAndKey(Zotero.Libraries.userLibraryID, key);
                    if (!obj || !obj.isFileAttachment() || obj.attachmentLinkMode != Zotero.Attachments.LINK_MODE_LINKED_FILE)
                    {
                        new_delete.push(key);
                        continue;
                    }

                    // Just do the original delete on all linked files
                    obj._eraseData = self._get_orig_func(orig_erase_data);
                    obj.eraseTx({skipEditCheck: true, skipDeleteLog: true});
                }

                results.deleted['items'] = new_delete;

                return results;
            });
        });
    }

    _monkey_patch(object, method, patcher)
    {
        let orig_func = object[method];
        let new_func = patcher(orig_func);

        let self = this;
        object[method] = function(...args)
        {;
            if (self._disabled) return orig_func.apply(this, args);
            return new_func.apply(this, args)
        };

        return this._orig_funcs.push(orig_func) - 1;
    }

    _get_orig_func(id)
    {
        return this._orig_funcs[id];
    }

    destroy()
    {
        Zotero.Notifier.unregisterObserver(this._notifierID);
        this._callback.destroy();
        this._disabled = true;
    }
}
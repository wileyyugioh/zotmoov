var ZotMoovBindings = class {
    constructor(zotmoov)
    {
        this._zotmoov = zotmoov;
        this._callback = new ZotMoovNotifyCallback(zotmoov);

        this._notifierID = Zotero.Notifier.registerObserver(this._callback, ['item'], 'zotmoov', 100);

        this._origConvertLinked = Zotero.Attachments.convertLinkedFileToStoredFile;
        this._origEraseData = Zotero.Item.prototype._eraseData;
        this._origGetDeleted = Zotero.Sync.APIClient.prototype.getDeleted;

        Zotero.Attachments.convertLinkedFileToStoredFile = this._convertLinkedFileToStoredFile.bind(this);

        let self = this;
        Zotero.Item.prototype._eraseData = Zotero.Promise.coroutine(function* (env) {
            return self._origEraseData.apply(this, [env]).then((val) =>
            {
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
        Zotero.Sync.APIClient.prototype.getDeleted = Zotero.Promise.coroutine(function* (libraryType, libraryTypeID, since) {
            let results = yield self._origGetDeleted.apply(this, [libraryType, libraryTypeID, since]);

            // Linked files only exist in user library
            if (libraryType != 'user') return results;

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
                obj._eraseData = self._origEraseData;
                obj.eraseTx({skipEditCheck: true, skipDeleteLog: true});
            }

            results.deleted['items'] = new_delete;

            return results;
        });
    }

    destroy()
    {
        Zotero.Notifier.unregisterObserver(this._notifierID);
        this._callback.destroy();

        Zotero.Attachments.convertLinkedFileToStoredFile = this._origConvertLinked;
        Zotero.Item.prototype._eraseData = this._origEraseData;
        Zotero.Sync.APIClient.prototype.getDeleted = this._origGetDeleted;
    }

    async _convertLinkedFileToStoredFile(item, options = {})
    {
        this._callback.disable();
        let ret = await this._origConvertLinked.apply(Zotero.Attachments, [item, options]);
        this._callback.enable();

        return ret;
    }
}
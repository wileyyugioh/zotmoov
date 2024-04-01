class ZotMoovBindings {
    constructor(zotmoov)
    {
        this._zotmoov = zotmoov;
        this._callback = new ZotMoovNotifyCallback(zotmoov);

        this._notifierID = Zotero.Notifier.registerObserver(this._callback, ['item'], 'zotmoov', 99);

        this._origConvertLinked = Zotero.Attachments.convertLinkedFileToStoredFile;
        this._origEraseData = Zotero.Item.prototype._eraseData;

        Zotero.Attachments.convertLinkedFileToStoredFile = this._convertLinkedFileToStoredFile.bind(this);

        let self = this;
        Zotero.Item.prototype._eraseData = Zotero.Promise.coroutine(function* (env) {
            return self._origEraseData.apply(this, [env]).then((val) =>
            {
                // This is a jank way to check if the erase is initiated
                // locally vs via a sync
                // We do not want to delete the file if initiated via a sync since
                // we are assuming that the folder is synchronized outside of Zotero
                if (!env.options.skipDeleteLog && Zotero.Prefs.get('extensions.zotmoov.delete_files', true))
                {
                    self._zotmoov.delete([this], Zotero.Prefs.get('extensions.zotmoov.dst_dir', true));
                }

                return val;
            });
        });
    }

    destroy()
    {
        Zotero.Notifier.unregisterObserver(this._notifierID);
        this._callback.destroy();

        Zotero.Attachments.convertLinkedFileToStoredFile = this._origConvertLinked;
        Zotero.Item.prototype._eraseData = this._origEraseData;
    }

    async _convertLinkedFileToStoredFile(item, options = {})
    {
        this._callback.disable();
        let ret = await this._origConvertLinked.apply(Zotero.Attachments, [item, options]);
        this._callback.enable();

        return ret;
    }
}
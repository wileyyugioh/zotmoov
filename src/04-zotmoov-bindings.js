class ZotMoovBindings {
    constructor(zotmoov) {
        this.zotmoov = zotmoov;

        this._origConvertLinked = Zotero.Attachments.convertLinkedFileToStoredFile;
        this._origEraseData = Zotero.Item.prototype._eraseData;

        Zotero.Attachments.convertLinkedFileToStoredFile = this._convertLinkedFileToStoredFile.bind(this);

        let self = this;
        Zotero.Item.prototype._eraseData = Zotero.Promise.coroutine(function* (env) {
            Zotero.log('hi');
            return self._origEraseData.apply(this, [env]);
        });
    }

    destroy() {
        Zotero.Attachments.convertLinkedFileToStoredFile = this._origConvertLinked;
        Zotero.Item.prototype._eraseData = this._origEraseData;
    }

    async _convertLinkedFileToStoredFile(item, options = {})
    {
        this.zotmoov.disable();
        let ret = await this._origConvertLinked.bind(Zotero.Attachments)(item, options);
        this.zotmoov.enable();

        return ret;
    }
}
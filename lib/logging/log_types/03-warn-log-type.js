var WarnLogType = class extends LogType {
    formatMessage(message, timestamp) {
        return `${this._prefix} - [${timestamp}] - WARN: ${message}\n${ZotMoovDebugger.getLatestMethod()}`;
    }
}
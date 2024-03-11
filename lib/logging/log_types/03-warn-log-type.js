class WarnLogType extends LogType {
    formatMessage(message, timestamp) {
        return `${this._prefix} - [${timestamp}] - WARN: ${message}\n${ZotmoovDebugger.getLatestMethod()}`;
    }
}
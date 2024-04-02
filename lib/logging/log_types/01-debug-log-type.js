var DebugLogType = class extends LogType {
    formatMessage(message, timestamp) {
        return `${this._prefix} - [${timestamp}] - DEBUG: ${message}`;
    }
}
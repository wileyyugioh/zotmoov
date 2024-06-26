var InfoLogType = class extends LogType {
    formatMessage(message, timestamp) {
        return `${this._prefix} - [${timestamp}] - INFO: ${message}`;
    }
}
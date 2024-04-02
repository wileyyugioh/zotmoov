var ErrorLogType = class extends LogType {
    formatMessage(message, timestamp) {
        return `${this._prefix} - [${timestamp}] - ERROR: ${message}\n ${ZotmoovDebugger.getStack()}`;
    }
}
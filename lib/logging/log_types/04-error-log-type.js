class ErrorLogType extends LogType {
    formatMessage(message, timestamp) {
        return `${this._prefix} - [${timestamp}] - ERROR: ${message}\n ${ZotMoovDebugger.getStack()}`;
    }
}
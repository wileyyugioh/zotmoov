var LogType = class {
    constructor(prefix) {
        this._prefix = prefix;

        if (this.constructor === LogType) {
            throw new Error("Abstract classes can't be instantiated.");
        }
    }

    formatMessage(message, timestamp) {
        throw new Error("Method 'formatMessage()' must be implemented.");
    }
}


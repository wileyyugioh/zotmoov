/**
 * Class representing a Zotmoov Debugger.
 */
class ZotMoovDebugger {
    /**
     * Constructor for the given class.
     *
     * @param {string} prefix - The prefix to be appended to log messages.
     * @param {IOutputManager} outputManager - The output manager object.
     * @remarks Please don't add readability punctuation to the prefix...
     * Do not add ':' to the prefix, or '-' that's all taken care of.
     */
    constructor(prefix, outputManager) {
        this._prefix = prefix;
        this.outputManager = outputManager;
        this._logMapping = {
            'debug': new DebugLogType(this._prefix),
            'info': new InfoLogType(this._prefix),
            'warn': new WarnLogType(this._prefix),
            'error': new ErrorLogType(this._prefix)
        };

        this.outputManager.write('', true, true);
    }

    /**
     * @private
     */
    _log(type, message) {
        const now = new Date();
        const timestamp = now.toLocaleString() + '.' + ('00' + (now.getMilliseconds())).slice(-3);
        const formattedMessage = this._logMapping[type].formatMessage(message, timestamp);

        Zotero.debug(formattedMessage);
        this.outputManager.write(formattedMessage);
    }

    debug(message) {
        this._log('debug', message);
    }

    info(message) {
        this._log('info', message);
    }

    warning(message) {
        this._log('warn', message);
    }

    error(message) {
        this._log('error', message);
    }

    static getLatestMethod() {
        const stackLines = new Error().stack.split('\n');
        if (stackLines.length > 4) {
            const latestMethod = stackLines[4].trim();
            return `   ->  ${latestMethod}`;
        }
        return 'Stack trace unavailable';
    }

    static getStack() {
        const stackLines = new Error().stack.split('\n');
        let stack = `Last method: ${stackLines[4].trim()}\n`;
        for (let i = 4; i < stackLines.length - 1; i++) {
            stack += `   -> ${stackLines[i].trim()}\n`;
        }
        return stack;
    }
}
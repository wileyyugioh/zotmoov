class ScriptLoader {
    constructor(rootURI) {
        this.rootURI = rootURI;
    }

    async loadScript(path) {
        await Services.scriptloader.loadSubScript(this.rootURI + path);
    }

    async loadScripts(paths) {
        for (let path of paths) {
            await this.loadScript(path);
        }
    }
}
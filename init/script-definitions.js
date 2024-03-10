class ScriptDefinitions {
    _convertScriptToPath(directory, scriptName) {
       return directory + '/' + scriptName + '.js';
    }

    getScriptPaths(){
        let lib_scripts = ['sanitize-filename', 'zotmoov-notify-callback']
        let src_scripts = ['zotmoov-wildcard', 'zotmoov', 'zotmoov-menus', 'zotmoov-prefs']

        let lib_paths = lib_scripts.map(this._convertScriptToPath.bind(this, 'lib'));
        let src_paths = src_scripts.map(this._convertScriptToPath.bind(this,'src'));

        return [].concat(lib_paths, src_paths);
    }
}

class ScriptDefinitions {
    _convertScriptToPath(directory, scriptName) {
       return directory + '/' + scriptName + '.js';
    }

    getScriptPaths(){
        let lib_scripts = ['sanitize-filename']
        let src_scripts = ['zotmoov', 'zotmoov_menus', 'zotmoov_prefs', 'zotmoov_wildcard']

        let lib_paths = lib_scripts.map(this._convertScriptToPath.bind(this, 'lib'));
        let src_paths = src_scripts.map(this._convertScriptToPath.bind(this,'src'));

        return [].concat(src_paths, lib_paths);
    }
}

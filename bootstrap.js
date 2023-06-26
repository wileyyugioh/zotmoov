// ZotMoov
// bootstrap.js
// Written by Wiley Yus

if (typeof Zotero == 'undefined') {
    var Zotero;
}
var chromeHandle;

function log(msg) {
    Zotero.debug('ZotMoov: ' + msg);
}

async function install() {    
    log('ZotMoov: Installed');
}

async function startup({ id, version, resourceURI, rootURI = resourceURI.spec }) {    
    Services.scriptloader.loadSubScript(rootURI + 'zotmoov.js');

    Zotero.PreferencePanes.register({
        pluginID: 'zotmoov@wileyy.com',
        src: rootURI + 'prefs.xhtml',
        scripts: [rootURI + 'zotmoov_prefs.js']
    });

    Zotero.ZotMoov.init({ id, version, rootURI });
}

function shutdown() {
    log('ZotMoov: Shutting down');
}

function uninstall() {    
    log('ZotMoov: Uninstalled');
}

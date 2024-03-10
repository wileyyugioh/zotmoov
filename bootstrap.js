// ZotMoov
// bootstrap.js
// Written by Wiley Yus

if (typeof Zotero == 'undefined')
{
    var Zotero;
}

function log(msg)
{
    Zotero.debug('ZotMoov: ' + msg);
}

async function install()
{    
    log('ZotMoov: Installed');

    // Fix for old version parity
    let old_pref = Zotero.Prefs.get('extensions.zotmoov.dst_dir')
    if (old_pref)
    {
        Zotero.Prefs.set('extensions.zotmoov.dst_dir', old_pref, true);
        Zotero.Prefs.clear('extensions.zotmoov.dst_dir');
    }
}

async function startup({ id, version, resourceURI, rootURI = resourceURI.spec })
{
    // Only ones we need to load directly here.
    Services.scriptloader.loadSubScript(rootURI + 'init/script-definitions.js');
    Services.scriptloader.loadSubScript(rootURI + 'init/script-loader.js');

    let scriptPaths = new ScriptDefinitions().getScriptPaths();
    let scriptLoader = new ScriptLoader(rootURI);

    await scriptLoader.loadScripts(scriptPaths);

    Zotero.PreferencePanes.register(
    {
        pluginID: 'zotmoov@wileyy.com',
        src: rootURI + 'prefs.xhtml',
        scripts: [rootURI + 'src/zotmoov_prefs.js']
    });

    Zotero.ZotMoov.init({ id, version, rootURI });
    Zotero.ZotMoov.Menus.loadAll();
}

function onMainWindowLoad({ window }) {
    Zotero.ZotMoov.Menus.load(window);
}

function onMainWindowUnload({ window }) {
    Zotero.ZotMoov.Menus.unload(window);
}

function shutdown()
{
    log('ZotMoov: Shutting down');
    Zotero.ZotMoov.destroy();
    Zotero.ZotMoov.Menus.unloadAll();

    Zotero.ZotMoov = null;
}

function uninstall()
{    
    log('ZotMoov: Uninstalled');
}

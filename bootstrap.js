// ZotMoov
// bootstrap.js
// Written by Wiley Yus

if (typeof Zotero == 'undefined')
{
    var Zotero;
}

// Declare zotmoov and zotmoovMenus at the top level
var zotmoov = null;
var zotmoovMenus = null;

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
    // Only ones we need to load directly here
    Services.scriptloader.loadSubScript(rootURI + 'init/script-definitions.js');
    Services.scriptloader.loadSubScript(rootURI + 'init/script-loader.js');

    let scriptPaths = new ScriptDefinitions().getScriptPaths();
    let scriptLoader = new ScriptLoader(rootURI);

    await scriptLoader.loadScripts(scriptPaths);

    const sanitizer = new Sanitizer();
    const zotmoovWildcard = new ZotmoovWildcard(sanitizer);

    zotmoov = new ZotMoov(id, version, zotmoovWildcard, sanitizer);
    zotmoovMenus = new ZotmoovMenus(zotmoov);

    Zotero.PreferencePanes.register(
        {
            pluginID: 'zotmoov@wileyy.com',
            src: rootURI + 'prefs.xhtml',
            scripts: [rootURI + 'src/zotmoov_prefs.js']
        });

    zotmoovMenus.loadAll();
}

function onMainWindowLoad({ window }) {
    zotmoovMenus.load(window);
}

function onMainWindowUnload({ window }) {
    zotmoovMenus.unload(window);
}

function shutdown()
{
    log('ZotMoov: Shutting down');
    zotmoov.destroy();
    zotmoovMenus.unloadAll();
}

function uninstall()
{
    log('ZotMoov: Uninstalled');
}
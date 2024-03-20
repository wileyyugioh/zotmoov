// ZotMoov
// bootstrap.js
// Written by Wiley Yu

// Declare zotmoov and zotmoovMenus at the top level
let first_startup = true;
let zotmoov = null;
let zotmoovMenus = null;

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
    if (first_startup)
    {
        // Only ones we need to load directly here
        Services.scriptloader.loadSubScript(rootURI + 'init/00-script-definitions.js');
        Services.scriptloader.loadSubScript(rootURI + 'init/01-script-loader.js');

        let scriptPaths = new ScriptDefinitions().getScriptPaths();
        let scriptLoader = new ScriptLoader(rootURI);

        await scriptLoader.loadScripts(scriptPaths);

        first_startup = false;
    }

    const directoryManager = new DirectoryManager();
    const outputManager = new OutputManager(directoryManager);
    const zotmoovDebugger = new ZotMoovDebugger('ZotMoov', outputManager);

    const sanitizer = new Sanitizer();
    const zotmoovWildcard = new ZotMoovWildcard(sanitizer);

    zotmoov = new ZotMoov(id, version, zotmoovWildcard, sanitizer, zotmoovDebugger);
    zotmoovMenus = new ZotMoovMenus(zotmoov);
    zotmoovBindings = new ZotMoovBindings(zotmoov);

    Zotero.PreferencePanes.register(
        {
            pluginID: 'zotmoov@wileyy.com',
            src: rootURI + 'prefs.xhtml',
            scripts: [rootURI + 'zotmoov-prefs.js']
        });

    zotmoovMenus.loadAll();

    // Need to expose our addon to rest of Zotero
    Zotero.ZotMoov = zotmoov;
    Zotero.ZotMoov.Menus = zotmoovMenus;
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
    zotmoovMenus.unloadAll();
    zotmoovBindings.destroy();

    zotmoov = null;
    zotmoovMenus = null;
    Zotero.ZotMoov = null;
}

function uninstall()
{
    log('ZotMoov: Uninstalled');
}
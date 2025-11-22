// ZotMoov
// bootstrap.js
// Written by Wiley Yu

// Declare at top level
let zotmoov = null;
let zotmoovMenus = null;
let zotmoovBindings = null;
let chromeHandle = null;

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
    Services.scriptloader.loadSubScript(rootURI + 'init/00-script-definitions.js');
    Services.scriptloader.loadSubScript(rootURI + 'init/01-script-loader.js');

    let scriptPaths = new ScriptDefinitions().getScriptPaths();
    let scriptLoader = new ScriptLoader(rootURI);

    await scriptLoader.loadScripts(scriptPaths);

    const directoryManager = new DirectoryManager();
    const outputManager = new OutputManager(directoryManager);
    const zotmoovDebugger = new ZotMoovDebugger('ZotMoov', outputManager);

    const sanitizer = new Sanitizer();
    const zotmoovWildcard = new ZotMoovWildcard(sanitizer, ZotMoovCWParser);

    zotmoov = new ZotMoov(id, version, rootURI, zotmoovWildcard, sanitizer, zotmoovDebugger);
    zotmoovBindings = new ZotMoovBindings(zotmoov);

    if (ZotMoovNewMenus.hasFeatures)
    {
        // Use the new MenuManager API if available (Zotero 8+)
        zotmoovMenus = new ZotMoovNewMenus(zotmoov, zotmoovBindings, ZotMoovCMUParser);
    }
    else
    {
        zotmoovMenus = new ZotMoovMenus(zotmoov, zotmoovBindings, ZotMoovCMUParser);
    }

    Zotero.PreferencePanes.register(
        {
            id: 'zotmoov_basic',
            pluginID: 'zotmoov@wileyy.com',
            src: rootURI + 'preferences/prefs.xhtml',
            scripts: [rootURI + 'preferences/zotmoov-prefs.js'],
            helpURL: 'https://github.com/wileyyugioh/zotmoov/blob/master/docs/SETTINGS_INFO.md'
    });

    Zotero.PreferencePanes.register(
        {
            id: 'zotmoov_advanced',
            pluginID: 'zotmoov@wileyy.com',
            parent: 'zotmoov_basic',
            src: rootURI + 'preferences/adv_prefs.xhtml',
            scripts: [rootURI + 'preferences/zotmoov-adv-prefs.js'],
            helpURL: 'https://github.com/wileyyugioh/zotmoov/blob/master/docs/SETTINGS_INFO.md#advanced-options'
    });

    Zotero.PreferencePanes.register(
        {
            id: 'zotmoov_keyboard',
            pluginID: 'zotmoov@wileyy.com',
            parent: 'zotmoov_basic',
            src: rootURI + 'preferences/keyboard_shortcuts.xhtml',
            scripts: [rootURI + 'preferences/zotmoov-keyboard-prefs.js']
    });

    zotmoovMenus.init();
    zotmoovMenus.loadAll();

    // Need to expose our addon to rest of Zotero
    Zotero.ZotMoov = zotmoov;
    Zotero.ZotMoov.Menus = zotmoovMenus;
    Zotero.ZotMoov.Menus.Custom = { 'Parser': ZotMoovCMUParser, 'Commands': ZotMoovCMUParser.Commands };
    Zotero.ZotMoov.Commands = { 'Parser': ZotMoovCWParser, 'Commands': ZotMoovCWParser.Commands };

    let aomStartup = Cc['@mozilla.org/addons/addon-manager-startup;1'].getService(Ci.amIAddonManagerStartup);
    let manifestURI = Services.io.newURI(rootURI + 'manifest.json');
    chromeHandle = aomStartup.registerChrome(manifestURI, [
        ['content', 'zotmoov', 'chrome/content/']
    ]);
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

    chromeHandle.destruct();
    chromeHandle = null;
    
    zotmoovMenus.destroy();
    zotmoovBindings.destroy();

    zotmoov = null;
    zotmoovMenus = null;
    zotmoovBindings = null;
    Zotero.ZotMoov = null;
}

function uninstall()
{
    log('ZotMoov: Uninstalled');
}
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
    Services.scriptloader.loadSubScript(rootURI + 'zotmoov.js');
    Services.scriptloader.loadSubScript(rootURI + 'lib/sanitize-filename.js');

    Services.scriptloader.loadSubScript(rootURI + 'zotmoov_menus.js');

    Zotero.PreferencePanes.register(
    {
        pluginID: 'zotmoov@wileyy.com',
        src: rootURI + 'prefs.xhtml',
        scripts: [rootURI + 'zotmoov_prefs.js']
    });

    Zotero.ZotMoov.init({ id, version, rootURI });
    Zotero.ZotMoov.Menus.init();
}

function shutdown()
{
    log('ZotMoov: Shutting down');
    Zotero.ZotMoov.destroy();
    Zotero.ZotMoov.Menus.destroy();

    Zotero.ZotMoov = null;
}

function uninstall()
{    
    log('ZotMoov: Uninstalled');
    Zotero.ZotMoov.destroy();
    Zotero.ZotMoov.Menus.destroy();

    Zotero.ZotMoov = null;
}

// ZotMoov
// zotmoov_prefs.js
// Written by Wiley Yu

Zotero.ZotMoov.Prefs =
{
    init()
    {
        let enable_subdir_move = Zotero.Prefs.get('extensions.zotmoov.enable_subdir_move', true);
        document.getElementById('zotmoov-subdir-str').disabled = !enable_subdir_move;

        this._loadFileExtTable()
    },

    async pickDirectory()
    {
        let fp = Components.classes['@mozilla.org/filepicker;1'].createInstance(Components.interfaces.nsIFilePicker);

        fp.init(window, Zotero.getString('dataDir.selectDir'), fp.modeGetFolder);
        fp.appendFilters(fp.filterAll);
        let rv = await new Zotero.Promise(function(resolve)
        {
            fp.open((returnConstant) => resolve(returnConstant));
        });
        if (rv != fp.returnOK) return '';

        Zotero.Prefs.set('extensions.zotmoov.dst_dir', fp.file.path, true);
        document.getElementById('zotmoov-dst-dir').value = fp.file.path;
    },

    onSubDirClick(cb)
    {
        document.getElementById('zotmoov-subdir-str').disabled = !cb.checked;
    },

    updateMenuItems(item)
    {
        let v = item.value;
        if(v == 'move')
        {
            Zotero.ZotMoov.Menus.setMove();
        } else
        {
            Zotero.ZotMoov.Menus.setCopy();
        }
    },

    _loadFileExtTable()
    {
        let tree = document.getElementById('zotmoov-settings-fileext-tree')
        tree.addEventListener('change', this.onFileExtTreeChange);

        let fileexts = Zotero.Prefs.get('extensions.zotmoov.allowed_fileext', true).split(',');

        let treechildren = document.getElementById('zotmoov-settings-fileext-treechildren');
        for (let fileext of fileexts)
        {
            let treeitem = document.createXULElement('treeitem');
            let treerow = document.createXULElement('treerow');
            let treecell = document.createXULElement('treecell');
            treecell.setAttribute('label', fileext);

            treerow.appendChild(treecell);
            treeitem.appendChild(treerow);
            treechildren.appendChild(treeitem);
        }

        const config = {
            attributes: true,
            subtree: true,
            attributeFilter: ['label'],
            attributeOldValue: true
        };

        const callback = (mutationList) =>
        {
            for (const mutation of mutationList)
            {
                if (mutation.type == 'attributes')
                {
                    let fileexts = Zotero.Prefs.get('extensions.zotmoov.allowed_fileext', true).split(',');

                    const index = fileexts.indexOf(mutation.oldValue);
                    if (index > -1)
                    {
                        fileexts[index] = mutation.target.getAttribute(mutation.attributeName);
                        Zotero.Prefs.set('extensions.zotmoov.allowed_fileext', fileexts.join(','), true);
                    }
                }
              }
        }

        const observer = new MutationObserver(callback);
        observer.observe(treechildren, config);
    }
};

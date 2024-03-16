class ZotMoovPrefs {
    constructor(zotmoovMenus)
    {
        this.zotmoovMenus = zotmoovMenus;
    }

    init()
    {
        let enable_subdir_move = Zotero.Prefs.get('extensions.zotmoov.enable_subdir_move', true);
        document.getElementById('zotmoov-subdir-str').disabled = !enable_subdir_move;

        this._loadFileExtTable()
    }

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
    }

    onSubDirClick(cb)
    {
        document.getElementById('zotmoov-subdir-str').disabled = !cb.checked;
    }

    updateMenuItems(item)
    {
        let v = item.value;
        if(v == 'move')
        {
            this.zotmoovMenus.setMove();
        } else
        {
            this.zotmoovMenus.setCopy();
        }
    }

    createFileExtEntry()
    {
        let dummy_value = 'New File Extension';
        let treechildren = document.getElementById('zotmoov-settings-fileext-treechildren');
        
        let treeitem = document.createXULElement('treeitem');
        let treerow = document.createXULElement('treerow');
        let treecell = document.createXULElement('treecell');
        treecell.setAttribute('label', 'New File Extension');

        treerow.appendChild(treecell);
        treeitem.appendChild(treerow);
        treechildren.appendChild(treeitem);

        let fileexts = JSON.parse(Zotero.Prefs.get('extensions.zotmoov.allowed_fileext', true));
        fileexts.push(dummy_value);
        Zotero.Prefs.set('extensions.zotmoov.allowed_fileext', JSON.stringify(fileexts), true);
    }

    removeFileExtEntries()
    {
        let tree = document.getElementById('zotmoov-settings-fileext-tree');
        let treechildren = document.getElementById('zotmoov-settings-fileext-treechildren');

        let start = {};
        let end = {};
        let num_ranges = tree.view.selection.getRangeCount();
        let selected_text = [];
        let children = [];

        for (let t = 0; t < num_ranges; t++)
        {
            tree.view.selection.getRangeAt(t, start, end);
            for (let v = start.value; v <= end.value; v++)
            {
                let text = tree.view.getCellText(v, tree.columns.getColumnAt(0));
                selected_text.push(text);
                children.push(treechildren.children[v]);
            }
        }

        let fileexts = JSON.parse(Zotero.Prefs.get('extensions.zotmoov.allowed_fileext', true));
        for (let text of selected_text)
        {
            const index = fileexts.indexOf(text);
            if (index > -1) fileexts.splice(index, 1);
        }
        Zotero.Prefs.set('extensions.zotmoov.allowed_fileext', JSON.stringify(fileexts), true);

        for (let child of children)
        {
            child.remove();
        }
    }

    onFileExtTreeSelect()
    {
        let tree = document.getElementById('zotmoov-settings-fileext-tree');
        let sel = tree.view.selection.currentIndex;

        let remove_button = document.getElementById('zotmoov-fileext-table-delete');
        if (sel > -1)
        {
            remove_button.disabled = false;
            return;
        }

        remove_button.disabled = true;
    }

    _loadFileExtTable()
    {
        let fileexts = JSON.parse(Zotero.Prefs.get('extensions.zotmoov.allowed_fileext', true));

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
                    let fileexts = JSON.parse(Zotero.Prefs.get('extensions.zotmoov.allowed_fileext', true));

                    const index = fileexts.indexOf(mutation.oldValue);
                    if (index > -1)
                    {
                        fileexts[index] = mutation.target.getAttribute(mutation.attributeName);
                        Zotero.Prefs.set('extensions.zotmoov.allowed_fileext', JSON.stringify(fileexts), true);
                    }
                }
              }
        }

        const observer = new MutationObserver(callback);
        observer.observe(treechildren, config);
    }
}

// Expose to Zotero
Zotero.ZotMoov.Prefs = new ZotMoovPrefs(Zotero.ZotMoov.Menus);
var React = require('react');
var ReactDOM = require('react-dom');
var VirtualizedTable = require('components/virtualized-table');

class ZotMoovPrefs {
    constructor(zotmoovMenus, rootURI)
    {
        this.zotmoovMenus = zotmoovMenus;
        this._fileexts = JSON.parse(Zotero.Prefs.get('extensions.zotmoov.allowed_fileext', true));
    }

    createFileExtTree()
    {
        const columns = [
            {
                dataKey: 'fileext',
                label: 'fileext'
            }
        ];
        
        let renderItem = (index, selection, oldDiv=null, columns) => {
            const ext = this._fileexts[index];
            let div;

            if (oldDiv)
            {
                div = oldDiv;
                div.innerHTML = '';
            } else {
                div = document.createElement('div');
                div.className = 'row';
            }

            div.classList.toggle('selected', selection.isSelected(index));

            for (let column of columns)
            {
                if (column.dataKey != 'fileext') continue;

                let span = document.createElement('span');
                span.className = 'cell';
                span.innerText = ext;
                div.appendChild(span);
                break;
            }

            return div;
        };

        ReactDOM.createRoot(document.getElementById('zotmoov-settings-fileext-tree-2')).render(React.createElement(VirtualizedTable, {
            getRowCount: () => this._fileexts.length,
            id: 'zotmoov-settings-fileext-tree-2-treechildren',
            ref: (ref) => { this._fileext_tree = ref; },
            renderItem: renderItem,
            onSelectionChange: (selection) => Zotero.log(selection),
            showHeader: false,
            columns: columns,
            staticColumns: true,
            multiSelect: true,
            disableFontSizeScaling: true
        }));
    }

    init()
    {
        let enable_subdir_move = Zotero.Prefs.get('extensions.zotmoov.enable_subdir_move', true);
        document.getElementById('zotmoov-subdir-str').disabled = !enable_subdir_move;

        let enable_attach_dir = Zotero.Prefs.get('extensions.zotmoov.enable_attach_dir', true);
        document.getElementById('zotmoov-attach-search-dir').disabled = !enable_attach_dir;
        document.getElementById('zotmoov-attach-search-dir-button').disabled = !enable_attach_dir;

        this.createFileExtTree();
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

    async pickSearchDirectory()
    {
        let fp = Components.classes['@mozilla.org/filepicker;1'].createInstance(Components.interfaces.nsIFilePicker);

        fp.init(window, Zotero.getString('dataDir.selectDir'), fp.modeGetFolder);
        fp.appendFilters(fp.filterAll);
        let rv = await new Zotero.Promise(function(resolve)
        {
            fp.open((returnConstant) => resolve(returnConstant));
        });
        if (rv != fp.returnOK) return '';

        Zotero.Prefs.set('extensions.zotmoov.attach_search_dir', fp.file.path, true);
        document.getElementById('zotmoov-attach-search-dir').value = fp.file.path;
    }

    onSubDirClick(cb)
    {
        document.getElementById('zotmoov-subdir-str').disabled = !cb.checked;
    }

    onEnableSearchClick(cb)
    {
        document.getElementById('zotmoov-attach-search-dir').disabled = !cb.checked;
        document.getElementById('zotmoov-attach-search-dir-button').disabled = !cb.checked;

        if(cb.checked)
        {
            this.zotmoovMenus.showAttachNewFile();
        } else
        {
            this.zotmoovMenus.hideAttachNewFile();
        }
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
        this._fileexts.push(dummy_value);
        this._fileext_tree.invalidate();
        Zotero.Prefs.set('extensions.zotmoov.allowed_fileext', JSON.stringify(this._fileexts), true);
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
}

// Expose to Zotero
Zotero.ZotMoov.Prefs = new ZotMoovPrefs(Zotero.ZotMoov.Menus);
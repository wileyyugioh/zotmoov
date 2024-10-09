var React = require('react');
var ReactDOM = require('react-dom');
var VirtualizedTable = require('components/virtualized-table');

// Needed to fix Zotero bug where on initial load all of the elements are not
// loaded because of faulty race-condition when calculating div height
class FixedVirtualizedTable extends VirtualizedTable {
    _getWindowedListOptions() {
        let v = super._getWindowedListOptions();
        v.overscanCount = 10;

        return v;
    }
}

class ZotMoovPrefs {
    constructor(zotmoovMenus)
    {
        this.zotmoovMenus = zotmoovMenus;
    }

    createFileExtTree()
    {
        this._fileexts = JSON.parse(Zotero.Prefs.get('extensions.zotmoov.allowed_fileext', true));

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

        ReactDOM.createRoot(document.getElementById('zotmoov-settings-fileext-tree-2')).render(React.createElement(FixedVirtualizedTable, {
            getRowCount: () => this._fileexts.length,
            id: 'zotmoov-settings-fileext-tree-2-treechildren',
            ref: (ref) => { this._fileext_tree = ref; },
            renderItem: renderItem,
            onSelectionChange: (selection) => this.onFileExtTreeSelect(selection),
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
    }

    spawnFileExtDialog() {
        // Change to const later
        var win = await window.openDialog('about:blank', '_blank', 'chrome,centerscreen');

        win.addEventListener('DOMContentLoaded', () => {
            const doc = win.document;

            doc.title = 'ZotMoov';

            const ss_link = doc.createElement('link');
            ss_link.rel = 'stylesheet';
            ss_link.href = 'chrome://zotero-platform/content/zotero.css';
            doc.head.appendChild(ss_link);

            const vbox = doc.createXULElement('vbox');

            const title_label = doc.createXULElement('label');
            title_label.innerHTML = 'New File Extension';

            const text_input = doc.createElement('input');
            text_input.type = 'text';

            const hbox = doc.createXULElement('hbox');
            hbox.align = 'center';
            hbox.pack = 'end';

            const sp = doc.createXULElement('spacer');
            sp.flex = '1';

            const no_button = doc.createElement('button');
            no_button.innerHTML = 'Cancel';
            no_button.style = 'min-width: 80px; margin-inline-end: 6px;';

            const yes_button = doc.createElement('button');
            yes_button.innerHTML = 'Ok';
            yes_button.style = 'style="min-width: 80px;';

            hbox.appendChild(sp);
            hbox.appendChild(no_button);
            hbox.appendChild(yes_button);

            vbox.appendChild(title_label);
            vbox.appendChild(text_input);
            vbox.appendChild(hbox);


            doc.body.appendChild(vbox);
        });
        /*
        let dummy_value = 'New File Extension';
        this._fileexts.push(dummy_value);
        this._fileext_tree.invalidate();
        Zotero.Prefs.set('extensions.zotmoov.allowed_fileext', JSON.stringify(this._fileexts), true);
        */
    }

    removeFileExtEntries()
    {
        let selection = this._fileext_tree.selection;

        let fileexts = this._fileexts;
        let to_remove = Array.from(selection.selected).map(i => this._fileexts[i]);

        for (let text of to_remove)
        {
            const index = fileexts.indexOf(text);
            if (index > -1) fileexts.splice(index, 1);
        }

        this._fileext_tree.invalidate();
        Zotero.Prefs.set('extensions.zotmoov.allowed_fileext', JSON.stringify(fileexts), true);
        document.getElementById('zotmoov-fileext-table-delete').disabled = true;
    }

    onFileExtTreeSelect(selection)
    {
        let remove_button = document.getElementById('zotmoov-fileext-table-delete');
        if (selection.count > 0)
        {
            remove_button.disabled = false;
            return;
        }

        remove_button.disabled = true;
    }
}

// Expose to Zotero
Zotero.ZotMoov.Prefs = new ZotMoovPrefs(Zotero.ZotMoov.Menus);
var React = require('react');
var ReactDOM = require('react-dom');
var VirtualizedTable = require('components/virtualized-table');

class ZotMoovAdvancedPrefs {
    // Needed to fix Zotero bug where on initial load all of the elements are not
    // loaded because of faulty race-condition when calculating div height
    static FixedVirtualizedTable  = class extends VirtualizedTable {
        _getWindowedListOptions() {
            let v = super._getWindowedListOptions();
            v.overscanCount = 10;

            return v;
        }
    }

    async createCWTree()
    {
        const wc_menu_sel_val = document.getElementById('zotmoov-adv-settings-wc-sel-menu').selectedItem.value;
        const wc_commands =  this._savedcommands[wc_menu_sel_val];

        const columns = [
            {
                dataKey: 'index',
                htmlLabel: '<span data-l10n-id="zotmoov-adv-settings-wc-column-index"></span>',
                width: 50,
            },
            {
                dataKey: 'command_name',
                htmlLabel: '<span data-l10n-id="zotmoov-adv-settings-wc-column-command"></span>',
                width: 100,
            },
            {
                dataKey: 'desc',
                htmlLabel: '<span data-l10n-id="zotmoov-adv-settings-wc-column-desc"></span>',
            },
        ];
        
        let renderItem = (index, selection, oldDiv=null, columns) => {
            const command = wc_commands[index];

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
            div.classList.toggle('focused', selection.focused == index);

            const cd = Zotero.ZotMoov.Commands.Parser.parse(command).getColumnData();
            for (let column of columns)
            {
                const data = (column.dataKey == 'index') ? index.toString() : cd[column.dataKey];
                div.appendChild(VirtualizedTable.renderCell(index, data, column));
            }

            return div;
        };

        ReactDOM.createRoot(document.getElementById('zotmoov-adv-settings-cw-tree')).render(React.createElement(this.constructor.FixedVirtualizedTable, {
            getRowCount: () => wc_commands.length,
            id: 'zotmoov-adv-settings-cw-tree-treechildren',
            ref: (ref) => { this._cw_tree = ref; },
            renderItem: renderItem,
            onSelectionChange: (selection) => this.onCWTreeSelect(selection),
            showHeader: true,
            columns: columns,
            staticColumns: true,
            multiSelect: false,
            disableFontSizeScaling: true
        }));
    }

    init()
    {
        this._savedcommands = JSON.parse(Zotero.Prefs.get('extensions.zotmoov.cwc_commands', true));
        this.createCWTree();
    }

    createCWEntryFromDialog(wc, command_name, index, data_obj)
    {
        // Validate that first input is text
        const COMMAND_STRUCT = Zotero.ZotMoov.Commands.Commands;
        if (index == 0 && !([COMMAND_STRUCT.TextCommand.COMMAND_NAME, COMMAND_STRUCT.FieldCommand.COMMAND_NAME].includes(command_name))) return;

        const wc_commands = this._savedcommands[wc];
        wc_commands.splice(index, 0, Zotero.ZotMoov.Commands.Parser.parse({...data_obj, command_name: command_name}));

        let selection = this._cw_tree.selection;
        for (let i of selection.selected)
        {
            selection.toggleSelect(i);
        }

        this._cw_tree.invalidate();
        Zotero.Prefs.set('extensions.zotmoov.cwc_commands', JSON.stringify(this._savedcommands), true);

        selection.toggleSelect(index);

    }

    editCWEntryFromDialog(wc, command_name, index, data_obj)
    {
        this._savedcommands[wc][index] = Zotero.ZotMoov.Commands.Parser.parse({...data_obj, command_name: command_name});

        this._cw_tree.invalidate();
        Zotero.Prefs.set('extensions.zotmoov.cwc_commands', JSON.stringify(this._savedcommands), true); 
    }

    spawnCWDialog(operation, index, data)
    {
        const wc_menu_sel_val = document.getElementById('zotmoov-adv-settings-wc-sel-menu').selectedItem.value;
        let wc_commands =  this._savedcommands[wc_menu_sel_val];

        window.openDialog('chrome://zotmoov/content/custom-wc-dialog.xhtml',
            'zotmoov-custom-wc-dialog-window',
            'chrome,centerscreen,resizable=no,modal',
            {
                wc: document.getElementById('zotmoov-adv-settings-wc-sel-menu').selectedItem.value,
                index: index,
                operation: operation,
                data: data,
            }
        );
    }

    moveCWEntryUp()
    {
        let selection = this._cw_tree.selection;

        const wc_menu_sel_val = document.getElementById('zotmoov-adv-settings-wc-sel-menu').selectedItem.value;
        let wc_commands =  this._savedcommands[wc_menu_sel_val];

        let focus_index = -1;
        for (let index of selection.selected)
        {
            if (index == 0) continue;

            const temp = wc_commands[index - 1];
            wc_commands[index - 1] = wc_commands[index];
            wc_commands[index] = temp;

            focus_index = index - 1;
            selection.toggleSelect(index);
        }

        if (focus_index >= 0) selection.toggleSelect(focus_index);
        this._cw_tree.invalidate();
        Zotero.Prefs.set('extensions.zotmoov.cwc_commands', JSON.stringify(this._savedcommands), true);

        if (selection.focused == 0) document.getElementById('zotmoov-adv-settings-cw-up').disabled = true;
    }

    moveCWEntryDown()
    {
        let selection = this._cw_tree.selection;

        const wc_menu_sel_val = document.getElementById('zotmoov-adv-settings-wc-sel-menu').selectedItem.value;
        let wc_commands =  this._savedcommands[wc_menu_sel_val];

        let focus_index = -1;
        for (let index of selection.selected)
        {
            if (index == wc_commands.length - 1) continue;

            const temp = wc_commands[index + 1];
            wc_commands[index + 1] = wc_commands[index];
            wc_commands[index] = temp;

            focus_index = index + 1;
            selection.toggleSelect(index);
        }

        if (focus_index >= 0) selection.toggleSelect(focus_index)
        this._cw_tree.invalidate();
        Zotero.Prefs.set('extensions.zotmoov.cwc_commands', JSON.stringify(this._savedcommands), true);

        if (selection.focused == wc_commands.length - 1) document.getElementById('zotmoov-adv-settings-cw-down').disabled = true;
    }

    editCWEntry()
    {
        let selection = this._cw_tree.selection;

        const wc_menu_sel_val = document.getElementById('zotmoov-adv-settings-wc-sel-menu').selectedItem.value;
        let wc_commands =  this._savedcommands[wc_menu_sel_val];

        for (let index of selection.selected)
        {
            this.spawnCWDialog('edit', index, wc_commands[index]);
            break;
        }
    }

    createCWEntry()
    {
        const wc_menu_sel_val = document.getElementById('zotmoov-adv-settings-wc-sel-menu').selectedItem.value;
        let wc_commands =  this._savedcommands[wc_menu_sel_val];

        this.spawnCWDialog('create', wc_commands.length);
    }

    removeCWEntries()
    {
        let selection = this._cw_tree.selection;

        const wc_menu_sel_val = document.getElementById('zotmoov-adv-settings-wc-sel-menu').selectedItem.value;
        let wc_commands =  this._savedcommands[wc_menu_sel_val];

        for (let index of selection.selected)
        {
            wc_commands.splice(index, 1);
        }

        this._cw_tree.invalidate();
        Zotero.Prefs.set('extensions.zotmoov.cwc_commands', JSON.stringify(this._savedcommands), true);

        if (selection.focused > wc_commands.length - 1)
        {
            document.getElementById('zotmoov-adv-settings-cw-delete').disabled = true;
            document.getElementById('zotmoov-adv-settings-cw-edit').disabled = true;
            document.getElementById('zotmoov-adv-settings-cw-up').disabled = true;
            document.getElementById('zotmoov-adv-settings-cw-down').disabled = true;
        }
    }

    onCWTreeSelect(selection)
    {
        const wc_menu_sel_val = document.getElementById('zotmoov-adv-settings-wc-sel-menu').selectedItem.value;
        let wc_commands =  this._savedcommands[wc_menu_sel_val];
        let selected = selection.selected;

        document.getElementById('zotmoov-adv-settings-cw-delete').disabled = !selected.size;
        document.getElementById('zotmoov-adv-settings-cw-edit').disabled = !selected.size
        document.getElementById('zotmoov-adv-settings-cw-up').disabled = (!selected.size || selected.has(0));
        document.getElementById('zotmoov-adv-settings-cw-down').disabled = (!selected.size || selected.has(wc_commands.length - 1));
    }

    changeSelectedWildcard(item)
    {
        document.getElementById('zotmoov-adv-settings-cw-tree').replaceChildren();
        this.createCWTree();
    }
}

// Expose to Zotero
Zotero.ZotMoov.Prefs.Advanced = new ZotMoovAdvancedPrefs();
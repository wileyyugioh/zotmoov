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

    static MoveableEntries = class {
        constructor(tree, sel_menu, commands, buttons)
        {
            this.tree = tree;
            this.sel_menu = sel_menu;
            this.commands = commands;
            this.buttons = buttons;
        }

        moveEntryUp()
        {
            let selection = this.tree.selection;

            const wc_menu_sel_val = this.sel_menu.selectedItem.value;
            let wc_commands =  this.commands[wc_menu_sel_val];

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
            this.tree.invalidate();

            if (selection.focused <= 1) this.buttons.up.disabled = true;
        }

        moveEntryDown()
        {
            let selection = this.tree.selection;

            const wc_menu_sel_val = this.sel_menu.selectedItem.value;
            let wc_commands =  this.commands[wc_menu_sel_val];

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
            this.tree.invalidate();

            if (selection.focused == wc_commands.length - 1) this.buttons.down.disabled = true;
        }

        removeEntries()
        {
            let selection = this.tree.selection;

            const wc_menu_sel_val = this.sel_menu.selectedItem.value;
            let wc_commands =  this.commands[wc_menu_sel_val];

            for (let index of selection.selected)
            {
                wc_commands.splice(index, 1);
            }

            this.tree.invalidate();

            if (selection.focused > wc_commands.length - 1)
            {
                this.buttons.delete.disabled = true;
                this.buttons.edit.disabled = true;
                this.buttons.up.disabled = true;
                this.buttons.down.disabled = true;
            } else if (selection.focused == wc_commands.length - 1)
            {
                this.buttons.down.disabled = true;
            }
        }

        createEntry(index)
        {
            let selection = this.tree.selection;
            for (let i of selection.selected)
            {
                selection.toggleSelect(i);
            }

            this.tree.invalidate();
            selection.toggleSelect(index);
        }

        onTreeSelect(selection)
        {
            const wc_menu_sel_val = this.sel_menu.selectedItem.value;
            let wc_commands =  this.commands[wc_menu_sel_val];
            let selected = selection.selected;

            this.buttons.delete.disabled = (!selected.size || (selected.has(0) && wc_commands.length > 1));
            this.buttons.edit.disabled = !selected.size
            this.buttons.up.disabled = (!selected.size || selected.has(0) || selected.has(1));
            this.buttons.down.disabled = (!selected.size || selected.has(0) || selected.has(wc_commands.length - 1));
        }
    }

    loadCMUMenuItems()
    {
        const cmu_menu_sel_val = document.getElementById('zotmoov-adv-settings-cmu-sel-menu');
        for (let k of Object.keys(this._savedcmus))
        {
            cmu_menu_sel_val.appendItem(k, k);
        }
    }

    async createCMUTree()
    {
        const sel_val = document.getElementById('zotmoov-adv-settings-cmu-sel-menu').selectedItem.value;
        if (this._savedcmus[sel_val] == null) this._savedcmus[sel_val] = [];
        const commands =  this._savedcmus[sel_val];

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
            const command = commands[index];

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

            const cd = Zotero.ZotMoov.Menu.Custom.parse(command).getColumnData();
            for (let column of columns)
            {
                const data = (column.dataKey == 'index') ? index.toString() : cd[column.dataKey];
                div.appendChild(VirtualizedTable.renderCell(index, data, column));
            }

            return div;
        }
    }

    async createCWTree()
    {
        const wc_menu_sel_val = document.getElementById('zotmoov-adv-settings-wc-sel-menu').selectedItem.value;
        if (this._savedcommands[wc_menu_sel_val] == null) this._savedcommands[wc_menu_sel_val] = [];
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
            ref: (ref) => {
                this._cw_tree = ref;
                this._moveable_cmds = new this.constructor.MoveableEntries(this._cw_tree,
                    document.getElementById('zotmoov-adv-settings-wc-sel-menu'),
                    this._savedcommands,
                    {
                        up: document.getElementById('zotmoov-adv-settings-cw-up'),
                        down: document.getElementById('zotmoov-adv-settings-cw-down'),
                        edit: document.getElementById('zotmoov-adv-settings-cw-edit'),
                        delete: document.getElementById('zotmoov-adv-settings-cw-delete'),
                    }
                );
            },
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
        this._savedcmus = JSON.parse(Zotero.Prefs.get('extensions.zotmoov.custom_menu_items', true));

        this.createCWTree();
    }

    createCWEntryFromDialog(wc, command_name, index, data_obj)
    {
        // Validate that first input is text
        const COMMAND_STRUCT = Zotero.ZotMoov.Commands.Commands;
        if (index == 0 && !([COMMAND_STRUCT.TextCommand.COMMAND_NAME, COMMAND_STRUCT.FieldCommand.COMMAND_NAME].includes(command_name))) return;

        const wc_commands = this._savedcommands[wc];
        wc_commands.splice(index, 0, Zotero.ZotMoov.Commands.Parser.parse({...data_obj, command_name: command_name}));

        this._moveable_cmds.createEntry(index);

        Zotero.Prefs.set('extensions.zotmoov.cwc_commands', JSON.stringify(this._savedcommands), true);

    }

    editCWEntryFromDialog(wc, command_name, index, data_obj)
    {
        this._savedcommands[wc][index] = Zotero.ZotMoov.Commands.Parser.parse({...data_obj, command_name: command_name});

        this._cw_tree.invalidate();
        Zotero.Prefs.set('extensions.zotmoov.cwc_commands', JSON.stringify(this._savedcommands), true); 
    }

    spawnCWDialog(operation, index, data)
    {
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

    moveCWEntryUp()
    {
        this._moveable_cmds.moveEntryUp();
        Zotero.Prefs.set('extensions.zotmoov.cwc_commands', JSON.stringify(this._savedcommands), true);
    }

    moveCWEntryDown()
    {
        this._moveable_cmds.moveEntryDown();
        Zotero.Prefs.set('extensions.zotmoov.cwc_commands', JSON.stringify(this._savedcommands), true);
    }

    removeCWEntries()
    {
        this._moveable_cmds.removeEntries();
        Zotero.Prefs.set('extensions.zotmoov.cwc_commands', JSON.stringify(this._savedcommands), true);
    }

    onCWTreeSelect(selection)
    {
        this._moveable_cmds.onTreeSelect(selection);
    }

    changeSelectedWildcard(item)
    {
        document.getElementById('zotmoov-adv-settings-cw-tree').replaceChildren();
        this.createCWTree();
    }
}

// Expose to Zotero
Zotero.ZotMoov.Prefs.Advanced = new ZotMoovAdvancedPrefs();
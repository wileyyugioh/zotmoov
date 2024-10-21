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
        constructor(tree, sel_menu, commands, buttons, freeze_row = 0)
        {
            this.tree = tree;
            this.sel_menu = sel_menu;
            this.commands = commands;
            this.buttons = buttons;
            this.freeze_row = freeze_row;
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

            if (selection.focused <= this.freeze_row) this.buttons.up.disabled = true;
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

            for (let index of Array.from(selection.selected).reverse())
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

            const selected_is_freeze_ninc = Array.from(selected).some(e => [...Array(this.freeze_row).keys()].includes(e));
            const selected_is_freeze_inc = Array.from(selected).some(e => [...Array(this.freeze_row + 1).keys()].includes(e));

            this.buttons.delete.disabled = (!selected.size || (selected_is_freeze_ninc && wc_commands.length > this.freeze_row));
            this.buttons.edit.disabled = !selected.size
            this.buttons.up.disabled = (!selected.size || selected_is_freeze_inc);
            this.buttons.down.disabled = (!selected.size || selected_is_freeze_ninc || selected.has(wc_commands.length - 1));
        }
    }

    static CustomItemManager = class {
        constructor(sel_menu, parser, tree_id, commands, id, pref, freeze_row, buttons, dialog)
        {
            this.sel_menu = sel_menu;
            this.parser = parser;
            this.tree_id = tree_id;
            this.commands = commands;
            this.id = id;
            this.pref = pref;
            this.freeze_row = freeze_row;
            this.buttons = buttons;
            this.dialog = dialog;
        }

        async createTree()
        {
            const sel_menu = this.sel_menu;
            if (sel_menu.itemCount < 1) return;

            let sel_val = sel_menu.selectedItem.value;
            if (this.commands[sel_val] == null) this.commands[sel_val] = [];
            const commands =  this.commands[sel_val];

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

                const cd = this.parser.parse(command).getColumnData();
                for (let column of columns)
                {
                    const data = (column.dataKey == 'index') ? index.toString() : cd[column.dataKey];
                    div.appendChild(VirtualizedTable.renderCell(index, data, column));
                }

                return div;
            }

            ReactDOM.createRoot(document.getElementById(this.tree_id)).render(React.createElement(ZotMoovAdvancedPrefs.FixedVirtualizedTable, {
                getRowCount: () => commands.length,
                id: this.id,
                ref: (ref) => {
                    this.tree = ref;
                    this.moveable = new ZotMoovAdvancedPrefs.MoveableEntries(this.tree,
                        this.sel_menu,
                        this.commands,
                        this.buttons,
                        this.freeze_row
                    );
                },
                renderItem: renderItem,
                onSelectionChange: (selection) => this.onTreeSelect(selection),
                showHeader: true,
                columns: columns,
                staticColumns: true,
                multiSelect: false,
                disableFontSizeScaling: true
            }));
        }

        createEntryFromDialog(wc, command_name, index, data_obj)
        {
            const wc_commands = this.commands[wc];
            wc_commands.splice(index, 0, this.parser.parse({...data_obj, command_name: command_name}));

            this.moveable.createEntry(index);

            Zotero.Prefs.set(this.pref, JSON.stringify(this.commands), true);
        }

        editEntryFromDialog(wc, command_name, index, data_obj)
        {
            this.commands[wc][index] = this.parser.parse({...data_obj, command_name: command_name});

            this.tree.invalidate();
            Zotero.Prefs.set(this.pref, JSON.stringify(this.commands), true); 
        }

        spawnDialog(operation, index, data)
        {
            window.openDialog(this.dialog,
                this.dialog_id,
                'chrome,centerscreen,resizable=no,modal',
                {
                    wc: this.sel_menu.selectedItem.value,
                    index: index,
                    operation: operation,
                    data: data,
                }
            );
        }

        editEntry()
        {
            let selection = this.tree.selection;

            const wc_menu_sel_val = this.sel_menu.selectedItem.value;
            let wc_commands =  this.commands[wc_menu_sel_val];

            for (let index of selection.selected)
            {
                this.spawnDialog('edit', index, wc_commands[index]);
                break;
            }
        }

        createEntry()
        {
            const wc_menu_sel_val = this.sel_menu.selectedItem.value;
            let wc_commands =  this.commands[wc_menu_sel_val];

            this.spawnDialog('create', wc_commands.length);
        }

        moveEntryUp()
        {
            this.moveable.moveEntryUp();
            Zotero.Prefs.set(this.pref, JSON.stringify(this.commands), true);
        }

        moveEntryDown()
        {
            this.moveable.moveEntryDown();
            Zotero.Prefs.set(this.pref, JSON.stringify(this.commands), true);
        }

        removeEntries()
        {
            this.moveable.removeEntries();
            Zotero.Prefs.set(this.pref, JSON.stringify(this.commands), true);
        }

        onTreeSelect(selection)
        {
            this.moveable.onTreeSelect(selection);
        }

        changeSelectedItem()
        {
            document.getElementById(this.tree_id).replaceChildren();
            this.createTree();
        }
    }

    static CWItemManager = class extends this.CustomItemManager {
        createEntryFromDialog(wc, command_name, index, data_obj)
        {
            // Validate that first input is text or field
            const COMMAND_STRUCT = Zotero.ZotMoov.Commands.Commands;
            if (index == 0 && !([COMMAND_STRUCT.TextCommand.COMMAND_NAME, COMMAND_STRUCT.FieldCommand.COMMAND_NAME].includes(command_name))) return;

            super.createEntryFromDialog(wc, command_name, index, data_obj);
        }
    }

    static CMUItemManager = class extends this.CustomItemManager {
        spawnMenuItemCreateDialog()
        {
            window.openDialog('chrome://zotmoov/content/add-cmu-dialog.xhtml',
                'zotmoov-add-cmu-dialog-window',
                'chrome,centerscreen,resizable=no,modal');
        }

        spawnMenuItemDeleteDialog()
        {
            window.openDialog('chrome://zotmoov/content/del-cmu-dialog.xhtml',
                'zotmoov-add-cmu-dialog-window',
                'chrome,centerscreen,resizable=no,modal',
                {
                    index: this.sel_menu.selectedIndex,
                    title: this.sel_menu.selectedItem.value,
                }
            );
        }

        createMenuItem(title)
        {
            if (title in this.commands)
            {
                for (let i = 0; i < this.sel_menu.itemCount; i++)
                {
                    if (this.sel_menu.getItemAtIndex(i).value != title) continue;
                    this.sel_menu.selectedIndex = i;
                    super.changeSelectedItem();
                    return;
                }
            }

            this.commands[title] = [];

            const sel_menu = this.sel_menu;
            const sel_item = sel_menu.appendItem(title, title);


            sel_item.setAttribute('oncommand', 'Zotero.ZotMoov.Prefs.Advanced.Cmu.changeSelectedItem(this);');

            sel_menu.selectedItem = sel_item;
            sel_menu.disabled = false;
            document.getElementById('zotmoov-adv-settings-cmu-sel-delete').disabled = false;
            document.getElementById('zotmoov-adv-settings-cmu-add').disabled = false;

            super.changeSelectedItem();
            Zotero.Prefs.set('extensions.zotmoov.custom_menu_items', JSON.stringify(this.commands), true);
        }

        deleteMenuItem(index, title)
        {
            delete this.commands[title];

            const sel_menu = this.sel_menu;
            sel_menu.getItemAtIndex(index).remove();
            if (sel_menu.itemCount > 0)
            {
                sel_menu.selectedIndex = 0;
            } else
            {
                sel_menu.selectedIndex = -1;
                sel_menu.disabled = true;

                document.getElementById('zotmoov-adv-settings-cmu-sel-delete').disabled = true;

                document.getElementById('zotmoov-adv-settings-cmu-down').disabled = true;
                document.getElementById('zotmoov-adv-settings-cmu-up').disabled = true;
                document.getElementById('zotmoov-adv-settings-cmu-edit').disabled = true;
                document.getElementById('zotmoov-adv-settings-cmu-delete').disabled = true;
                document.getElementById('zotmoov-adv-settings-cmu-add').disabled = true;
            }

            super.changeSelectedItem();
            Zotero.Prefs.set(this.pref, JSON.stringify(this.commands), true);
        }

        loadMenuItems()
        {
            for (let k of Object.keys(this.commands))
            {
                let mu = this.sel_menu.appendItem(k, k);
                mu.setAttribute('oncommand', 'Zotero.ZotMoov.Prefs.Advanced.Cmu.changeSelectedItem(this);');
            }

            if (this.sel_menu.itemCount > 0)
            {
                this.sel_menu.selectedIndex = 0;
                this.sel_menu.disabled = false;
                document.getElementById('zotmoov-adv-settings-cmu-sel-delete').disabled = false;
                document.getElementById('zotmoov-adv-settings-cmu-add').disabled = false;
            }
        }
    }

    init()
    {
        this._savedcommands = JSON.parse(Zotero.Prefs.get('extensions.zotmoov.cwc_commands', true));
        this._savedcmus = JSON.parse(Zotero.Prefs.get('extensions.zotmoov.custom_menu_items', true));

        this.Cw = new this.constructor.CWItemManager(
            document.getElementById('zotmoov-adv-settings-wc-sel-menu'),
            Zotero.ZotMoov.Commands.Parser,
            'zotmoov-adv-settings-cw-tree',
            this._savedcommands,
            'zotmoov-adv-settings-cw-tree-treechildren',
            'extensions.zotmoov.cwc_commands',
            1,
            {
                up: document.getElementById('zotmoov-adv-settings-cw-up'),
                down: document.getElementById('zotmoov-adv-settings-cw-down'),
                edit: document.getElementById('zotmoov-adv-settings-cw-edit'),
                delete: document.getElementById('zotmoov-adv-settings-cw-delete'),
            },
            'chrome://zotmoov/content/custom-wc-dialog.xhtml'
        );
        this.Cw.createTree();

        this.Cmu = new this.constructor.CMUItemManager(
            document.getElementById('zotmoov-adv-settings-cmu-sel-menu'),
            Zotero.ZotMoov.Menus.Custom.Parser,
            'zotmoov-adv-settings-cmu-tree',
            this._savedcmus,
            'zotmoov-adv-settings-cmu-tree-treechildren',
            'extensions.zotmoov.custom_menu_items',
            0,
            {
                up: document.getElementById('zotmoov-adv-settings-cmu-up'),
                down: document.getElementById('zotmoov-adv-settings-cmu-down'),
                edit: document.getElementById('zotmoov-adv-settings-cmu-edit'),
                delete: document.getElementById('zotmoov-adv-settings-cmu-delete'),
            },
            'chrome://zotmoov/content/custom-cmu-dialog.xhtml'
        );
        this.Cmu.loadMenuItems();
        this.Cmu.createTree();
    }
}

// Expose to Zotero
Zotero.ZotMoov.Prefs.Advanced = new ZotMoovAdvancedPrefs();
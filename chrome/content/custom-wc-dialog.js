document.addEventListener('dialogaccept', () => myOnAccept());

let cwentry_todo = Zotero.ZotMoov.Prefs.Advanced.Cw.createEntryFromDialog.bind(Zotero.ZotMoov.Prefs.Advanced.Cw);
let window_args =
{
    wc: '%1',
    data: null,
    index: null,
    operation: 'create'
};

const States =
{
    [Zotero.ZotMoov.Commands.Commands.TextCommand.COMMAND_NAME]: class
    {
        static load(data)
        {
            document.getElementById('zotmoov-cw-label1').setAttribute('data-l10n-id', 'zotmoov-adv-settings-text-label1')

            let txt_input = document.getElementById('zotmoov-cw-text-input1');
            txt_input.style.display = '';
            txt_input.setAttribute('oninput', 'States["' + Zotero.ZotMoov.Commands.Commands.TextCommand.COMMAND_NAME + '"].onInput();');

            if (data)
            {
                txt_input.value = data.text;
            }

            document.getElementById('zotmoov-cw-dialog').getButton('accept').disabled = txt_input.value.trim() === '';
        }

        static unload()
        {
            document.getElementById('zotmoov-cw-dialog').getButton('accept').disabled = false;

            let label1 = document.getElementById('zotmoov-cw-label1');
            label1.setAttribute('data-l10n-id', '');
            label1.innerHTML = '';

            let txt_input = document.getElementById('zotmoov-cw-text-input1');
            txt_input.style.display = 'none';
            txt_input.setAttribute('oninput', '');
        }

        static onAccept()
        {
            const text = document.getElementById('zotmoov-cw-text-input1').value;
            cwentry_todo(window_args.wc, Zotero.ZotMoov.Commands.Commands.TextCommand.COMMAND_NAME, window_args.index, { text: text });
        }

        static onInput()
        {
            document.getElementById('zotmoov-cw-dialog').getButton('accept').disabled = event.target.value.trim() === '';
        }
    },

    [Zotero.ZotMoov.Commands.Commands.FieldCommand.COMMAND_NAME]: class
    {
        static load(data)
        {
            document.getElementById('zotmoov-cw-label1').setAttribute('data-l10n-id', 'zotmoov-adv-settings-field-label1')

            let txt_input = document.getElementById('zotmoov-cw-text-input1');
            txt_input.style.display = '';
            txt_input.setAttribute('oninput', 'States["' + Zotero.ZotMoov.Commands.Commands.FieldCommand.COMMAND_NAME + '"].onInput();');

            if (data)
            {
                txt_input.value = data.field;
            }

            document.getElementById('zotmoov-cw-dialog').getButton('accept').disabled = txt_input.value.trim() === '';
        }

        static unload()
        {
            document.getElementById('zotmoov-cw-dialog').getButton('accept').disabled = false;

            let label1 = document.getElementById('zotmoov-cw-label1');
            label1.setAttribute('data-l10n-id', '');
            label1.innerHTML = '';

            let txt_input = document.getElementById('zotmoov-cw-text-input1');
            txt_input.style.display = 'none';
            txt_input.setAttribute('oninput', '');
        }

        static onAccept()
        {
            const text = document.getElementById('zotmoov-cw-text-input1').value;
            cwentry_todo(window_args.wc,
                Zotero.ZotMoov.Commands.Commands.FieldCommand.COMMAND_NAME,
                window_args.index,
                { field: text }
            );
        }

        static onInput()
        {
            document.getElementById('zotmoov-cw-dialog').getButton('accept').disabled = event.target.value.trim() === '';
        }
    },

    [Zotero.ZotMoov.Commands.Commands.LowercaseCommand.COMMAND_NAME]: class
    {
        static load() {}
        static unload() {}
        static onAccept()
        {
            cwentry_todo(window_args.wc, Zotero.ZotMoov.Commands.Commands.LowercaseCommand.COMMAND_NAME, window_args.index);
        }
    },

    [Zotero.ZotMoov.Commands.Commands.UppercaseCommand.COMMAND_NAME]: class
    {
        static load() {}
        static unload() {}
        static onAccept()
        {
            cwentry_todo(window_args.wc, Zotero.ZotMoov.Commands.Commands.UppercaseCommand.COMMAND_NAME, window_args.index);
        }
    },

    [Zotero.ZotMoov.Commands.Commands.TrimCommand.COMMAND_NAME]: class
    {
        static load() {}
        static unload() {}
        static onAccept()
        {
            cwentry_todo(window_args.wc, Zotero.ZotMoov.Commands.Commands.TrimCommand.COMMAND_NAME, window_args.index);
        }
    },

    [Zotero.ZotMoov.Commands.Commands.ExecCommand.COMMAND_NAME]: class
    {
        static load(data)
        {
            document.getElementById('zotmoov-cw-label1').setAttribute('data-l10n-id', 'zotmoov-adv-settings-exec-label1')
            document.getElementById('zotmoov-cw-label2').setAttribute('data-l10n-id', 'zotmoov-adv-settings-exec-label2')
            document.getElementById('zotmoov-cw-label3').setAttribute('data-l10n-id', 'zotmoov-adv-settings-exec-label3')

            let txt_input = document.getElementById('zotmoov-cw-text-input1');
            txt_input.style.display = '';
            txt_input.setAttribute('oninput', 'States["' + Zotero.ZotMoov.Commands.Commands.ExecCommand.COMMAND_NAME + '"].onInput();');

            let num_input = document.getElementById('zotmoov-cw-number-input2');
            num_input.style.display = '';

            let txt_input3 = document.getElementById('zotmoov-cw-text-input3');
            txt_input3.style.display = '';

            if (data)
            {
                txt_input.value = data.regex;
                num_input.value = data.group;
                txt_input3.value = data.flags;
            }

            document.getElementById('zotmoov-cw-dialog').getButton('accept').disabled = txt_input.value.trim() === '';
        }

        static unload()
        {
            document.getElementById('zotmoov-cw-dialog').getButton('accept').disabled = false;

            let label1 = document.getElementById('zotmoov-cw-label1');
            label1.setAttribute('data-l10n-id', '');
            label1.innerHTML = '';

            let label2 = document.getElementById('zotmoov-cw-label2');
            label2.setAttribute('data-l10n-id', '');
            label2.innerHTML = '';

            let label3 = document.getElementById('zotmoov-cw-label3');
            label3.setAttribute('data-l10n-id', '');
            label3.innerHTML = '';

            let txt_input = document.getElementById('zotmoov-cw-text-input1');
            txt_input.style.display = 'none';

            let num_input = document.getElementById('zotmoov-cw-number-input2');
            num_input.style.display = 'none';

            let txt_input3 = document.getElementById('zotmoov-cw-text-input3');
            txt_input3.style.display = 'none';
        }

        static onAccept()
        {
            const regex = document.getElementById('zotmoov-cw-text-input1').value;
            const group = document.getElementById('zotmoov-cw-number-input2').value;
            const flags = document.getElementById('zotmoov-cw-text-input3').value;

            cwentry_todo(window_args.wc, Zotero.ZotMoov.Commands.Commands.ExecCommand.COMMAND_NAME,
                window_args.index,
                { regex: regex, group: group, flags: flags }
            );
        }

        static onInput()
        {
            document.getElementById('zotmoov-cw-dialog').getButton('accept').disabled = event.target.value.trim() === '';
        }
    },

    [Zotero.ZotMoov.Commands.Commands.ReplaceCommand.COMMAND_NAME]: class
    {
        static load(data)
        {
            document.getElementById('zotmoov-cw-label1').setAttribute('data-l10n-id', 'zotmoov-adv-settings-exec-label1')
            document.getElementById('zotmoov-cw-label2').setAttribute('data-l10n-id', 'zotmoov-adv-settings-replace-label2')
            document.getElementById('zotmoov-cw-label3').setAttribute('data-l10n-id', 'zotmoov-adv-settings-exec-label3')

            let txt_input = document.getElementById('zotmoov-cw-text-input1');
            txt_input.style.display = '';
            txt_input.setAttribute('oninput', 'States["' + Zotero.ZotMoov.Commands.Commands.ReplaceCommand.COMMAND_NAME + '"].onInput();');

            let txt_input2 = document.getElementById('zotmoov-cw-text-input2');
            txt_input2.style.display = '';
            txt_input2.setAttribute('oninput', 'States["' + Zotero.ZotMoov.Commands.Commands.ReplaceCommand.COMMAND_NAME + '"].onInput();');

            let txt_input3 = document.getElementById('zotmoov-cw-text-input3');
            txt_input3.style.display = '';

            if (data)
            {
                txt_input.value = data.regex;
                txt_input2.value = data.replace;
                txt_input3.value = data.flags;
            }

            document.getElementById('zotmoov-cw-dialog').getButton('accept').disabled = (txt_input.value.trim() === '') || (txt_input2.value.trim() === '');
        }

        static unload()
        {
            document.getElementById('zotmoov-cw-dialog').getButton('accept').disabled = false;

            let label1 = document.getElementById('zotmoov-cw-label1');
            label1.setAttribute('data-l10n-id', '');
            label1.innerHTML = '';

            let label2 = document.getElementById('zotmoov-cw-label2');
            label2.setAttribute('data-l10n-id', '');
            label2.innerHTML = '';

            let label3 = document.getElementById('zotmoov-cw-label3');
            label3.setAttribute('data-l10n-id', '');
            label3.innerHTML = '';

            let txt_input = document.getElementById('zotmoov-cw-text-input1');
            txt_input.style.display = 'none';

            let txt_input2 = document.getElementById('zotmoov-cw-text-input2');
            txt_input2.style.display = 'none';

            let txt_input3 = document.getElementById('zotmoov-cw-text-input3');
            txt_input3.style.display = 'none';
        }

        static onAccept()
        {
            const regex = document.getElementById('zotmoov-cw-text-input1').value;
            const replace_str = document.getElementById('zotmoov-cw-text-input2').value;
            const flags = document.getElementById('zotmoov-cw-text-input3').value;

            cwentry_todo(window_args.wc, Zotero.ZotMoov.Commands.Commands.ReplaceCommand.COMMAND_NAME,
                window_args.index,
                { regex: regex, replace: replace_str, flags: flags }
            );
        }

        static onInput()
        {
            let txt_input = document.getElementById('zotmoov-cw-text-input1').value;
            let txt_input2 = document.getElementById('zotmoov-cw-text-input2').value;

            document.getElementById('zotmoov-cw-dialog').getButton('accept').disabled = (txt_input.trim() === '');
        }
    },
};

{
    let current_state;
    function loadState(state, data)
    {
        if (current_state) current_state.unload();
        current_state = null;
        state.load(data);
        current_state = state;
    }

    function myOnAccept()
    {
        current_state.onAccept();
    }
}

function myOnLoad()
{
    if (window.arguments) window_args = {...window_args, ...window.arguments[0]};

    let sel_menu = document.getElementById('zotmoov-adv-settings-wc-sel-menu');

    // Disable everything except text or field if index is zero
    const start_i = 2;
    if (window_args.index == 0)
    {
        [...Array(sel_menu.itemCount - start_i).keys()].map((i) => sel_menu.getItemAtIndex(i + start_i)).forEach((e) => e.disabled = true);
        loadState(States[Zotero.ZotMoov.Commands.Commands.TextCommand.COMMAND_NAME]);
    } else
    {
        [...Array(start_i).keys()].map((i) => sel_menu.getItemAtIndex(i)).forEach((e) => e.disabled = true);
        sel_menu.selectedIndex = start_i;
        loadState(States[Zotero.ZotMoov.Commands.Commands.LowercaseCommand.COMMAND_NAME]);
    }

    // Change operation to edit
    if (window_args.operation == 'edit') cwentry_todo = Zotero.ZotMoov.Prefs.Advanced.Cw.editEntryFromDialog.bind(Zotero.ZotMoov.Prefs.Advanced.Cw);

    if (!window_args.data) return;
    for (const [index, commands] of Object.values(Zotero.ZotMoov.Commands.Commands).entries())
    {
        if (commands.COMMAND_NAME != window_args.data.command_name) continue;
        sel_menu.selectedIndex = index;
        loadState(States[commands.COMMAND_NAME], window_args.data);
    }
}

window.addEventListener('load', (event) => {
    myOnLoad();
});

document.getElementById('zotmoov-cw-item-text').addEventListener('command', (event) => {
    loadState(States[Zotero.ZotMoov.Commands.Commands.TextCommand.COMMAND_NAME]);
});

document.getElementById('zotmoov-cw-item-field').addEventListener('command', (event) => {
    loadState(States[Zotero.ZotMoov.Commands.Commands.FieldCommand.COMMAND_NAME]);
});

document.getElementById('zotmoov-cw-item-toLowerCase').addEventListener('command', (event) => {
    loadState(States[Zotero.ZotMoov.Commands.Commands.LowercaseCommand.COMMAND_NAME]);
});

document.getElementById('zotmoov-cw-item-toUpperCase').addEventListener('command', (event) => {
    loadState(States[Zotero.ZotMoov.Commands.Commands.UppercaseCommand.COMMAND_NAME]);
});

document.getElementById('zotmoov-cw-item-trim').addEventListener('command', (event) => {
    loadState(States[Zotero.ZotMoov.Commands.Commands.TrimCommand.COMMAND_NAME]);
});

document.getElementById('zotmoov-cw-item-exec').addEventListener('command', (event) => {
    loadState(States[Zotero.ZotMoov.Commands.Commands.ExecCommand.COMMAND_NAME]);
});

document.getElementById('zotmoov-cw-item-replace').addEventListener('command', (event) => {
    loadState(States[Zotero.ZotMoov.Commands.Commands.ReplaceCommand.COMMAND_NAME]);
});

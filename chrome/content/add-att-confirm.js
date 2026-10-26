document.addEventListener('dialogaccept', () => myOnAccept());

document.addEventListener('dialogcancel', () => myOnCancel());

let window_args = {
    orig_filename: '',
    new_filename: '',
    callback: null,
};

function myOnLoad()
{
    if (window.arguments) window_args = {...window_args, ...window.arguments[0]};

    document.getElementById('zotmoov-file-ext-dialog-input').value = window_args.new_filename;
    document.l10n.setArgs(document.getElementById('zotmoov-add-att-confirm-title'), { filename: window_args.orig_filename });

    document.addEventListener('L10nMutationsFinished', () => {
        window.sizeToContent();
    });
}

function myOnAccept()
{
    const text = document.getElementById('zotmoov-file-ext-dialog-input').value;
    window_args.callback(text);
}

function myOnCancel()
{
    window_args.callback('');
}

function myOnInput(event)
{
    document.getElementById('zotmoov-file-ext-dialog').getButton('accept').disabled = event.target.value.trim() === '';
}

window.addEventListener('load', (event) => {
    myOnLoad();
});

document.getElementById('zotmoov-file-ext-dialog-input').addEventListener('input', (event) => {
    myOnInput(event);
})

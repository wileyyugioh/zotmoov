document.addEventListener('dialogaccept', () => myOnAccept());

let window_args = {
    index: 0,
    title: ''
}

function myOnLoad()
{
    if (window.arguments)
    {
        window_args = {...window_args, ...window.arguments[0]};

        document.l10n.setArgs(document.getElementById('zotmoov-dialog-title'), { 'cmu-title': window_args.title });

        document.addEventListener('L10nMutationsFinished', () => {
            window.sizeToContent();
        });
    }
}

function myOnAccept()
{
    Zotero.ZotMoov.Prefs.Advanced.Cmu.deleteMenuItem(window_args.index, window_args.title);
}

window.addEventListener('load', (event) => {
    myOnLoad();
});

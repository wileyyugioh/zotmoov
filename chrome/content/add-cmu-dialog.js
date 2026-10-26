document.addEventListener('dialogaccept', () => myOnAccept());

function myOnLoad()
{
    document.getElementById('zotmoov-file-ext-dialog').getButton('accept').disabled = true;
}

function myOnAccept()
{
    const text = document.getElementById('zotmoov-file-ext-dialog-input').value;
    Zotero.ZotMoov.Prefs.Advanced.Cmu.createMenuItem(text);
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

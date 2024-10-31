# ZotMoov Custom Menu Items

Users have the ability to create their own custom menu items in ZotMoov, appearing in the context menu when you right-click an item.

1. Select the top [+] to create a new menu item. Give it a title that you want to appear in the context menu.
2. Select the bottom [+] to add a new command.
3. Press [+] to add subsequent commands. You can remove a command by [-] or change the order it is run in by [↑] or [↓]. You can also edit it using the edit button.
4. To delete the menu item, select it on the top dropdown menu and press the top [-].

## Menu Item Commands

### text

This behaves like the subdirectory string in the General Settings and follows the [same formatting](WILDCARD_INFO.md).

### field

This returns the field associated with the item. A list of all available fields is [here](https://www.zotero.org/support/dev/client_coding/javascript_api/search_fields).

### toLowerCase

Converts the string to lowercase.

### toUpperCase

Converts the string to uppercase.

### trim

Removes all whitespace from the beginning and end of the string.


### exec

Execute a search with a regular expression. This uses the [javascript implementation of exec](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/RegExp/exec).


### replace

Replaces a regex pattern with a string. This uses the [javascript implementation of replace](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/replace).
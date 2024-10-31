# ZotMoov Custom Wildcards

Users have the ability to create their own custom wildcards in ZotMoov, replacing %1, %2, ..., %9. They can be created/edited in Advanced Options.

1. Select the wildcard you want to edit in the drop down menu
2. Press [+] to add a wildcard command. The first command **must** be either ```text``` or ```field```.
3. Press [+] to add subsequent wildcard commands. You can remove a wildcard command by [-] or change the order it is run in by [↑] or [↓]. You can also edit it using the edit button.

## Wildcard Commands

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
# ZotMoov
A *simple* plugin for managing attachments in Zotero 7

ZotMoov can:
- Automatically move/copy imported attachments into a custom directory
- Manually move/copy imported attachments into a custom directory via right-clicking
- Automatically delete linked attachments from your computer when you delete them in Zotero

## Installation

[Download the latest release here](https://github.com/wileyyugioh/zotmoov/releases/latest)
- If using Firefox you have to right click the .xpi and save link as.

To set up with 3rd party syncing services, set the Linked Attachment Base Directory to the synced folder.

<img src="res/Image1.png" width="500"/>

Then point ZotMoov to that same folder.

<img src="res/Image2.png" width="500"/>

It is highly recommended to
1. **[Make a local backup before mooving your library](https://www.zotero.org/support/zotero_data)**
2. Give ZotMoov its own folder that other applications will not alter
3. Uncheck "Sync attachment files in My Library" in the Sync settings if you do not plan to use Zotero's cloud file storage

## FAQ

### File Renaming

I recommend using the [automatic file renaming functionality included in Zotero 7](https://www.zotero.org/support/file_renaming). It has support for custom patterns.

### Moving Files in Group Libraries

[Zotero does not support linked files for group libraries](https://www.zotero.org/support/attaching_files#linked_files), so ZotMoov can only move files in your personal library. Any linked files pointing to group libraries that are somehow created will be broken. The `copy` feature is unaffected by this limitation.

### Bugs/Feature Requests

Both can be filed [here](https://github.com/wileyyugioh/zotmoov/issues). Please keep feature requests tightly focused on the extension's core purpose of mooving attachments and linking them!

## Settings

### Directory to Move Files To

The base directory where ZotMoov will move/copy files

### File Behavior

By default ZotMoov will move and link your files. You can change the dropdown menu option to `copy` for ZotMoov to just make a back-up of your added files in the specified directory.

### Automatically Move/Copy Files When Added

When this is enabled, ZotMoov will automatically move/copy files whenever they are imported into Zotero. The types of files can be restricted by the **Allowed File Extensions** option.

### Automatically Move/Copy Files to Subdirectory

When this is enabled, ZotMoov will automatically move files into a custom subdirectory whenever
- a file is moved/copied via **Automatically Move/Copy Files When Added**
- the Move/Copy Selected to Directory menu option is used

By default the subdirectory string is `{%c}` which is by item collection. [Click here for the formatting options](https://github.com/wileyyugioh/zotmoov/blob/master/docs/WILDCARD_INFO.md)

### Automatically Delete External Linked Files in the ZotMoov Directory

When this is enabled, ZotMoov will automatically delete linked files in the ZotMoov directory. Meaning that when you permanently delete a linked file in Zotero, and that linked file points to a file in the ZotMoov directory, the file on your hard drive will be deleted. It will also delete any empty directories within the ZotMoov directory.

### Allowed File Extensions

By adding/removing entries to this table via the [+] and [-] buttons, you can choose which types of files ZotMoov will automatically move via **Automatically Move/Copy Files When Added**. If the table is empty, then all files will be moved regardless of their file extension. *This setting is not used for files moved via Move Selected to Directory menu option.*

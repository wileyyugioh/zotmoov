# ZotMoov
A *simple* plugin for Zotero 7 that mooves attachments and links them.

ZotMoov can automatically move added attachments into the directory of your choosing, or you can opt to manually move and link each file into their own respective directory.

## Installation

[Download the latest release here](https://github.com/wileyyugioh/zotmoov/releases)

Note that you have to right click the .xpi and save link as.

To set up with 3rd party syncing services, set the Linked Attachment Base Directory to the synced folder.

<img src="res/Image1.png" width="500"/>

Then point ZotMoov to that same folder.

<img src="res/Image2.png" width="500"/>

If you want to moove already existing files to the ZotMoov directory, you can right click them and use the appropriate menu item.

By default ZotMoov will move and link your files. You can change the dropdown menu option to `copy` for ZotMoov to just make a back-up of your added files in the specified directory.

You can enable the Collection Subdirectory option for ZotMoov to automatically create and place your file in a custom subdirectory

## FAQ

### File Renaming

I recommend using the [automatic file renaming functionality included in Zotero 7](https://www.zotero.org/support/file_renaming). It has support for custom patterns. You will have to enable “Rename linked files” from the General pane of the Zotero settings.

### Automatic Subdirectories

ZotMoov has an option to automatically move files into a custom subdirectory. By default it is `{%c}` which is by item collection. [Click here for the formatting options](https://github.com/wileyyugioh/zotmoov/blob/master/docs/WILDCARD_INFO.md)

### Bugs/Feature Requests

Both can be filed [here](https://github.com/wileyyugioh/zotmoov/issues). Please keep feature requests tightly focused on the extension's core purpose of mooving attachments and linking them!

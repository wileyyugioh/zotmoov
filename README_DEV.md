# Prerequisites
In order for you to be able to contribute to this plugin, you need:
1. To know Javascript to a degree.
2. To know either the Zotero plugin framework (their documentation lacks severely) or the Firefox extension development (it is similar).
3. A working Python environment (either a venv, git-ignored, or a global installation)

# Building the plugin

First, before building, and even before running Zotero in dev mode for the plugin (directly from source) you NEED to run `script_definition_builder.py`.
It automatically builds a file called `00-script-definitions.js` in the `init` folder, which is necessary for Zotero to load our plugin's code.

Mr. Hoorn wrote this builder in Python so that we don't have to hardcode every source file.

To build, depending on your environment, run `Makefile.UNIX` or `Makefile.WINDOWS`.

# Remarks

The `script_definition_builder.py` is not smart enough to detect file dependencies between javascript code, and this would be far too complicated to write anyway.
Therefore, every script needs to be sorted alphabetically in the way dependencies work. So, every source code file needs to be prefixed with a number that is relative to the folder.

If necessary, nested folders can also get a number prefix to fix load order issues.
The top-level folders are defined explicitly in `script_definition_builder.py` and therefore do not need prefixes.


By this, I mean that the numbers reset per folder.

### Example:
- Folder A
  - Folder A/00-Test
    - `00-abstract-type.js`
    - `01-specific-type.js`
  - Folder A/01-Common
  - Folder A/02-UsesCommon
  - `00-test.js`
  - `01-test2.js`
  - `02-test3.js`

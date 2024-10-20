class ZotMoovCMUParser
{
    static Commands =
    {
        Move: class
        {
            static get COMMAND_NAME() { return 'move'; };

            constructor(data_obj)
            {
                this.directory = data_obj.directory;
                this.enable_subdir = data_obj.enable_subdir;
                this.command_name = this.constructor.COMMAND_NAME;
            }

            getColumnData()
            {
                return {
                    'command_name': this.command_name,
                    'desc': 'move to ' + this.directory
                };
            }

            apply(items)
            {
                let prefs = Zotero.ZotMoov.getBasePrefs();
                prefs.into_subfolder = this.enable_subdir;

                return Zotero.ZotMoov.move(items, this.directory, prefs);
            }
        },

        Copy: class
        {
            static get COMMAND_NAME() { return 'copy'; };

            constructor(data_obj)
            {
                this.directory = data_obj.directory;
                this.enable_subdir = data_obj.enable_subdir;
                this.command_name = this.constructor.COMMAND_NAME;
            }

            getColumnData()
            {
                return {
                    'command_name': this.command_name,
                    'desc': 'Copy to ' + this.directory
                };
            }

            apply(items)
            {
                let prefs = Zotero.ZotMoov.getBasePrefs();
                prefs.into_subfolder = this.enable_subdir;

                return Zotero.ZotMoov.copy(items, this.directory, prefs);
            }
        },
    }

    constructor(json_obj = {})
    {
        this._cws = {};

        for (let [k, v] of Object.entries(json_obj))
        {
          this._cws[k] = v.map(f => this.constructor.parse(f));
        }
    }

    static parse(obj)
    {
        switch(obj.command_name)
        {
            case this.Commands.Move.COMMAND_NAME:
                return new this.Commands.Move(obj);
            case this.Commands.Copy.COMMAND_NAME:
                return new this.Commands.Copy(obj);
            default:
                break;
        }
    }

    apply(key, text)
    {
        if(!this._cws[key]) return null;
        return this._cws[key].reduce((new_text, cmd) => cmd.apply(new_text), text);
    }

    data()
    {
        return this._cws;
    }
}
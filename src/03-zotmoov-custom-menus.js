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
                this.enable_customdir = data_obj.enable_customdir;
                this.enable_subdir = data_obj.enable_subdir;

                this.command_name = this.constructor.COMMAND_NAME;
            }

            getColumnData()
            {
                const dir = this.directory ? this.directory : Zotero.Prefs.get('extensions.zotmoov.dst_dir', true);
                return {
                    'command_name': this.command_name,
                    'desc': { fluent: 'zotmoov-menu-item-move', args: `{ "text": "${ dir }" }` },
                };
            }

            async apply(items)
            {
                let prefs = Zotero.ZotMoov.getBasePrefs();
                prefs.into_subfolder = this.enable_subdir;

                const dir = this.enable_customdir ? this.directory : Zotero.Prefs.get('extensions.zotmoov.dst_dir', true);

                const temp = await Zotero.ZotMoov.move(items, dir, prefs);
                return temp
                    .filter(result => result.status === 'fulfilled' && result.value)
                    .map(result => result.value);
            }
        },

        Copy: class
        {
            static get COMMAND_NAME() { return 'copy'; };

            constructor(data_obj)
            {
                this.directory = data_obj.directory;
                this.enable_customdir = data_obj.enable_customdir;
                this.enable_subdir = data_obj.enable_subdir;

                this.command_name = this.constructor.COMMAND_NAME;
            }

            getColumnData()
            {
                const dir = this.directory ? this.directory : Zotero.Prefs.get('extensions.zotmoov.dst_dir', true);
                return {
                    'command_name': this.command_name,
                    'desc': { fluent: 'zotmoov-menu-item-copy', args: `{ "text": "${ dir }" }` },
                };
            }

            async apply(items)
            {
                let prefs = Zotero.ZotMoov.getBasePrefs();
                prefs.into_subfolder = this.enable_subdir;

                const dir = this.enable_customdir ? this.directory : Zotero.Prefs.get('extensions.zotmoov.dst_dir', true);

                const temp = await Zotero.ZotMoov.copy(items, dir, prefs);
                return temp
                    .filter(result => result.status === 'fulfilled' && result.value)
                    .map(result => result.value);
            }
        },

        AddTag: class
        {
            static get COMMAND_NAME() { return 'add_tag'; };

            constructor(data_obj)
            {
                this.tag = data_obj.tag;

                this.command_name = this.constructor.COMMAND_NAME;
            }

            getColumnData()
            {
                return {
                    'command_name': this.command_name,
                    'desc': { fluent: 'zotmoov-menu-item-addtag', args: `{ "text": "${ this.tag }" }` },
                };
            }

            apply(items)
            {
                for (let item of items)
                {
                    item.addTag(this.tag)
                    item.saveTx();
                }
                return items;
            }
        },

        RemoveTag: class
        {
            static get COMMAND_NAME() { return 'rem_tag'; };

            constructor(data_obj)
            {
                this.tag = data_obj.tag;

                this.command_name = this.constructor.COMMAND_NAME;
            }

            getColumnData()
            {
                return {
                    'command_name': this.command_name,
                    'desc': { fluent: 'zotmoov-menu-item-remtag', args: `{ "text": "${ this.tag }" }` },
                };
            }

            apply(items)
            {
                for (let item of items)
                {
                    item.removeTag(this.tag)
                    item.saveTx();
                }
                return items;
            }
        },

        MoveFrom: class
        {
            static get COMMAND_NAME() { return 'move_from'; };

            constructor(data_obj)
            {
                this.command_name = this.constructor.COMMAND_NAME;
            }

            getColumnData()
            {
                return {
                    'command_name': this.command_name,
                    'desc': { fluent: 'zotmoov-menu-item-movefrom' },
                };
            }

            async apply(items)
            {
                const temp = await Zotero.ZotMoov.moveFrom(items);
                return temp
                    .filter(result => result.status === 'fulfilled' && result.value)
                    .map(result => result.value);
            }
        }
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
            case this.Commands.AddTag.COMMAND_NAME:
                return new this.Commands.AddTag(obj);
            case this.Commands.RemoveTag.COMMAND_NAME:
                return new this.Commands.RemoveTag(obj);
            case this.Commands.MoveFrom.COMMAND_NAME:
                return new this.Commands.MoveFrom(obj);
            default:
                break;
        }
    }

    async apply(key, items)
    {
        if(!this._cws[key]) return null;

        // Need to do for loop because of promises
        let my_reduce = items;
        for (let cmd of this._cws[key])
        {
            my_reduce = await cmd.apply(my_reduce);
        }

        return my_reduce;
    }

    data()
    {
        return this._cws;
    }
}

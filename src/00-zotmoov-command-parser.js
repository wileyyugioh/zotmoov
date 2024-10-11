class ZotMoovCWParser
{
    static Commands =
    {
        TextCommand: class
        {
            static get COMMAND_NAME() { return 'text'; };

            constructor(data_obj)
            {
                this.text = data_obj.text;
                this.command_name = this.constructor.COMMAND_NAME;

                if(this.text == null) throw new TypeError('TextCommand: text is not defined');
            }

            getColumnData()
            {
                return {
                    'command_name': this.command_name,
                    'desc': this.text
                };
            }

            apply(item)
            {
                return Zotero.ZotMoov.wildcard.process_string(item, this.text);
            }
        },

        FieldCommand: class
        {
            static get COMMAND_NAME() { return 'field'; };

            constructor(data_obj)
            {
                this.field = data_obj.field;
                this.command_name = this.constructor.COMMAND_NAME;

                if(this.field == null) throw new TypeError('FieldCommand: field is not defined');
            }

            getColumnData()
            {
                return {
                    'command_name': this.command_name,
                    'desc': this.field
                };
            }

            apply(item)
            {
                return item.getField(this.field, false, true);
            }
        },

        LowercaseCommand: class
        {
            static get COMMAND_NAME() { return 'toLowerCase'; };

            constructor()
            {
                this.command_name = this.constructor.COMMAND_NAME;
            }

            getColumnData()
            {
                return {
                    'command_name': this.command_name,
                    'desc': ''
                };
            }

            apply(text)
            {
                return text.toLowerCase();
            }
        },

        UppercaseCommand: class
        {
            static get COMMAND_NAME() { return 'toUpperCase'; };

            constructor()
            {
                this.command_name = this.constructor.COMMAND_NAME;
            }

            getColumnData()
            {
                return {
                    'command_name': this.command_name,
                    'desc': ''
                };
            }

            apply(text)
            {
                return text.toUpperCase();
            }
        },

        TrimCommand: class
        {
            static get COMMAND_NAME() { return 'trim'; };

            constructor()
            {
                this.command_name = this.constructor.COMMAND_NAME;
            }

            getColumnData()
            {
                return {
                    'command_name': this.command_name,
                    'desc': ''
                };
            }

            apply(text)
            {
                return text.trim();
            }
        },

        ExecCommand: class
        {
            static get COMMAND_NAME() { return 'exec'; };

            constructor(data_obj)
            {
                this.regex = data_obj.regex;
                this.group = data_obj.group ? Number(data_obj.group) : 0;
                this.flags = data_obj.flags ? data_obj.flags : 'g';

                this.command_name = this.constructor.COMMAND_NAME;

                if(this.regex == null) throw new TypeError('ExecCommand: regex is not defined');
            }

            getColumnData()
            {
                return {
                    'command_name': this.command_name,
                    'desc': this.regex
                };
            }

            apply(text)
            {
                const reg = RegExp(this.regex, this.flags);
                return reg.exec(text)[group];
            }
        },

        ReplaceCommand: class
        {
            static get COMMAND_NAME() { return 'replace'; };

            constructor(data_obj)
            {
                this.regex = data_obj.regex;
                this.replace = data_obj.replace;
                this.flags = data_obj.flags ? data_obj.flags : 'g';

                this.command_name = this.constructor.COMMAND_NAME;

                if(this.regex == null) throw new TypeError('ReplaceCommand: regex is not defined');
                if(this.replace == null) throw new TypeError('ReplaceCommand: replace is not defined');
            }

            getColumnData()
            {
                return {
                    'command_name': this.command_name,
                    'desc': this.regex
                };
            }

            apply(text)
            {
                const reg = RegExp(this.regex, this.flags);
                return text.replace(reg, this.replace);
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
            case this.Commands.TextCommand.COMMAND_NAME:
                return new this.Commands.TextCommand(obj);
            case this.Commands.FieldCommand.COMMAND_NAME:
                return new this.Commands.FieldCommand(obj);
            case this.Commands.LowercaseCommand.COMMAND_NAME:
                return new this.Commands.LowercaseCommand(obj);
            case this.Commands.UppercaseCommand.COMMAND_NAME:
                return new this.Commands.UppercaseCommand(obj);
            case this.Commands.TrimCommand.COMMAND_NAME:
                return new this.Commands.TrimCommand(obj);
            case this.Commands.ExecCommand.COMMAND_NAME:
                return new this.Commands.ExecCommand(obj)
            case this.Commands.ReplaceCommand.COMMAND_NAME:
                return new this.Commands.ReplaceCommand(obj)
            default:
                break;
        }
    }

    apply(key, text)
    {
        return this._cws[key].reduce((new_text, cmd) => cmd.apply(new_text), text);
    }

    data()
    {
        return this._cws;
    }
}

class ZotMoovCWParser
{
    static TextCommand = class
    {
        constructor(data)
        {
            this.text = data.text;
            this.command_name = 'Text';
        }

        getColumnData()
        {
            return {
                'command_name': this.command_name,
                'desc': this.text
            };
        }

        apply(text)
        {
            return this.text;
        }
    }

    static LowercaseCommand = class
    {
        constructor()
        {
            this.command_name = 'toLowerCase';
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
    }

    static UppercaseCommand = class
    {
        constructor()
        {
            this.command_name = 'toUpperCase';
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
    }

    static TrimCommand = class
    {
        constructor()
        {
            this.command_name = 'trim';
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
    }

    static ExecCommand = class
    {
        constructor(data)
        {
            this.regex = data.regex;
            this.group = data.group ? data.group : 0;
            this.flags = data.flags ? data.flags : 'g';

            this.command_name = 'exec';
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
    }

    static ReplaceCommand = class
    {
        constructor(data)
        {
            this.regex = data.regex;
            this.replace = data.replace;
            this.flags = data.flags;

            this.command_name = 'replace';
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
            case 'text':
                return this.constructor.TextCommand(obj.text);
            case 'toLowerCase':
                return this.constructor.LowercaseCommand();
            case 'toUpperCase':
                return this.constructor.UppercaseCommand();
            case 'trim':
                return this.constructor.TrimCommand();
            case 'exec':
                return this.constructor.ExecCommand(obj.regex, obj.group, obj.flags)
            case 'replace':
                return this.constructor.ReplaceCommand(obj.regex, obj.replace, obj.flags)
            default:
                break;
        }
    }

    static create(command_name, ...args)
    {
        switch(command_name)
        {
            case 'text':
                return this.constructor.TextCommand(...args);
            case 'toLowerCase':
                return this.constructor.LowercaseCommand(...args);
            case 'toUpperCase':
                return this.constructor.UppercaseCommand(...args);
            case 'trim':
                return this.constructor.TrimCommand(...args);
            case 'exec':
                return this.constructor.ExecCommand(...args)
            case 'replace':
                return this.constructor.ReplaceCommand(...args)
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
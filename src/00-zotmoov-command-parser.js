class ZotMoovCWParser
{
    static TextCommand = class
    {
        constructor(text)
        {
            this.text = text;
            this.command_name = 'text';
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
        constructor(regex, group, flags)
        {
            this.regex = regex;
            this.group = group ? group : 0;
            this.flags = flags ? flags : 'g';

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
        constructor(regex, replace, flags)
        {
            this.regex = regex;
            this.replace = replace;
            this.flags = flags ? flags : 'g';

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
                return new this.TextCommand(obj.text);
            case 'toLowerCase':
                return new this.LowercaseCommand();
            case 'toUpperCase':
                return new this.UppercaseCommand();
            case 'trim':
                return new this.TrimCommand();
            case 'exec':
                return new this.ExecCommand(obj.regex, obj.group, obj.flags)
            case 'replace':
                return new this.ReplaceCommand(obj.regex, obj.replace, obj.flags)
            default:
                break;
        }
    }

    static create(command_name, ...args)
    {
        switch(command_name)
        {
            case 'text':
                return new this.TextCommand(...args);
            case 'toLowerCase':
                return new this.LowercaseCommand(...args);
            case 'toUpperCase':
                return new this.UppercaseCommand(...args);
            case 'trim':
                return new this.TrimCommand(...args);
            case 'exec':
                return new this.ExecCommand(...args)
            case 'replace':
                return new this.ReplaceCommand(...args)
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
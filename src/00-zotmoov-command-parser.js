class TextCommand
{
    constructor(data)
    {
        this.text = data.text;
        this.command_name = 'Text';
    }

    function getColumnData()
    {
        return {
            'command_name': this.command_name,
            'desc': this.text
        };
    }

    function apply(text)
    {
        return this.text;
    }
}

class LowercaseCommand
{
    constructor()
    {
        this.command_name = 'toLowerCase';
    }

    function getColumnData()
    {
        return {
            'command_name': this.command_name,
            'desc': ''
        };
    }

    function apply(text)
    {
        return text.toLowerCase();
    }
}

class UppercaseCommand
{
    constructor()
    {
        this.command_name = 'toUpperCase';
    }

    function getColumnData()
    {
        return {
            'command_name': this.command_name,
            'desc': ''
        };
    }

    function apply(text)
    {
        return text.toUpperCase();
    }
}

class TrimCommand
{
    constructor()
    {
        this.command_name = 'trim';
    }

    function getColumnData()
    {
        return {
            'command_name': this.command_name,
            'desc': ''
        };
    }

    function apply(text)
    {
        return text.trim();
    }
}

class ExecCommand
{
    constructor(data)
    {
        this.regex = data.regex;
        this.group = data.group ? data.group : 0;
        this.flags = data.flags ? data.flags : 'g';

        this.command_name = 'exec';
    }

    function getColumnData()
    {
        return {
            'command_name': this.command_name,
            'desc': this.regex
        };
    }

    function apply(text)
    {
        const reg = RegExp(this.regex, this.flags);
        return reg.exec(text)[group];
    }
}

class ReplaceCommand
{
    constructor(data)
    {
        this.regex = data.regex;
        this.replace = data.replace;
        this.flags = data.flags;

        this.command_name = 'replace';
    }

    function getColumnData()
    {
        return {
            'command_name': this.command_name,
            'desc': this.regex
        };
    }

    function apply(text)
    {
        const reg = RegExp(this.regex, this.flags);
        return text.replace(reg, this.replace);
    }
}

class ZotMoovCWParser
{
    constructor(json_obj = {})
    {
        this._cws = {};

        for (let [k, v] of Object.entries(json_obj))
        {
          this._cws[k] = v.map(f => this.constructor.parse(f));
        }
    }

    static function parse(obj)
    {
        switch(obj.command_name)
        {
            case 'text':
                return TextCommand(obj.text);
            case 'toLowerCase':
                return LowercaseCommand();
            case 'toUpperCase':
                return UppercaseCommand();
            case 'trim':
                return TrimCommand();
            case 'exec':
                return ExecCommand(obj.regex, obj.group, obj.flags)
            case 'replace':
                return ReplaceCommand(obj.regex, obj.replace, obj.flags)
            default:
                break;
        }
    }

    static function create(command_name, ...args)
    {
        switch(command_name)
        {
            case 'text':
                return TextCommand(...args);
            case 'toLowerCase':
                return LowercaseCommand(...args);
            case 'toUpperCase':
                return UppercaseCommand(...args);
            case 'trim':
                return TrimCommand(...args);
            case 'exec':
                return ExecCommand(...args)
            case 'replace':
                return ReplaceCommand(...args)
            default:
                break;
        }
    }

    function apply(key, text)
    {
        return this._cws[key].reduce((new_text, cmd) => cmd.apply(new_text), text);
    }

    function data()
    {
        return this._cws;
    }
}
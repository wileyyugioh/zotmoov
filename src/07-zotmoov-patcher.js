class ZotMoovPatcher {
    constructor()
    {
        this._disabled = false;
        this._orig_funcs = [];
    }

    monkey_patch(object, method, patcher)
    {
        let orig_func = object[method];
        let new_func = patcher(orig_func);

        let self = this;
        object[method] = function(...args)
        {
            if (self._disabled) return orig_func.apply(this, args);
            return new_func.apply(this, args)
        };

        return this._orig_funcs.push(orig_func) - 1;
    }

    get_orig_func(id)
    {
        return this._orig_funcs[id];
    }

    disable()
    {
        this._disabled = true;
    }

    enable()
    {
        this._disabled = false;
    }
}

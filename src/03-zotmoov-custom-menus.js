var ZotMoovCMUParser = class {
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
                    'command_name': { fluent: 'zotmoov-menu-item-move-title' },
                    'desc': { fluent: 'zotmoov-menu-item-move', args: `{ "text": "${ dir }" }` },
                };
            }

            async apply(items)
            {
                let prefs = Zotero.ZotMoov.getBasePrefs();
                prefs.into_subfolder = this.enable_subdir;

                const dir = this.enable_customdir ? this.directory : Zotero.Prefs.get('extensions.zotmoov.dst_dir', true);

                return await Zotero.ZotMoov.move(items, dir, prefs);
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
                    'command_name': { fluent: 'zotmoov-menu-item-copy-title' },
                    'desc': { fluent: 'zotmoov-menu-item-copy', args: `{ "text": "${ dir }" }` },
                };
            }

            async apply(items)
            {
                let prefs = Zotero.ZotMoov.getBasePrefs();
                prefs.into_subfolder = this.enable_subdir;

                const dir = this.enable_customdir ? this.directory : Zotero.Prefs.get('extensions.zotmoov.dst_dir', true);

                return await Zotero.ZotMoov.copy(items, dir, prefs);
            }
        },

        AddTag: class
        {
            static get COMMAND_NAME() { return 'add_tag'; };

            constructor(data_obj)
            {
                this.tag = data_obj.tag;
                this.do_parent = data_obj.do_parent === undefined ? false : data_obj.do_parent;

                this.command_name = this.constructor.COMMAND_NAME;

                if(this.tag == null) throw new TypeError('AddTag: tag is not defined');
            }

            getColumnData()
            {
                return {
                    'command_name': { fluent: 'zotmoov-menu-item-addtag-title' },
                    'desc': { fluent: 'zotmoov-menu-item-addtag', args: `{ "text": "${ this.tag }" }` },
                };
            }

            async apply(items)
            {
                let promises = [];
                for (let item of items)
                {
                    promises.push((async () => {
                        item.addTag(this.tag)
                        await item.saveTx();

                        if (!this.do_parent || !item.parentID) return;
                        const parent = item.parentItem;
                        parent.addTag(this.tag);
                        await parent.saveTx();
                    })());
                }

                await Promise.allSettled(promises);

                return items;
            }
        },

        RemoveTag: class
        {
            static get COMMAND_NAME() { return 'rem_tag'; };

            constructor(data_obj)
            {
                this.tag = data_obj.tag;
                this.do_parent = data_obj.do_parent === undefined ? false : data_obj.do_parent;

                this.command_name = this.constructor.COMMAND_NAME;

                if(this.tag == null) throw new TypeError('RemoveTag: tag is not defined');
            }

            getColumnData()
            {
                return {
                    'command_name': { fluent: 'zotmoov-menu-item-remtag-title' },
                    'desc': { fluent: 'zotmoov-menu-item-remtag', args: `{ "text": "${ this.tag }" }` },
                };
            }

            async apply(items)
            {
                let promises = [];
                for (let item of items)
                {
                    promises.push((async () => {
                        item.removeTag(this.tag)
                        await item.saveTx();

                        if (!this.do_parent || !item.parentID) return;
                        const parent = item.parentItem;
                        parent.removeTag(this.tag);
                        await parent.saveTx();
                    })());
                }

                await Promise.allSettled(promises);

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
                    'command_name': { fluent: 'zotmoov-menu-item-movefrom-title' },
                    'desc': { fluent: 'zotmoov-menu-item-movefrom' },
                };
            }

            async apply(items)
            {
                let prefs = Zotero.ZotMoov.getBasePrefs();

                return await Zotero.ZotMoov.moveFrom(items, prefs);
            }
        },

        AnnotationToNote: class
        {
            static get COMMAND_NAME() { return 'ann2note'; };

            constructor(data_obj)
            {
                this.command_name = this.constructor.COMMAND_NAME;
            }

            getColumnData()
            {
                return {
                    'command_name': { fluent: 'zotmoov-menu-item-ann2note-title' },
                    'desc': { fluent: 'zotmoov-menu-item-ann2note' },
                };
            }

            async apply(items)
            {
                const promises = items.map(item => Zotero.getActiveZoteroPane().addNoteFromAnnotationsForAttachment(item, { skipSelect: true }));
                const selected_collection = Zotero.getActiveZoteroPane().getSelectedCollection(true);
                const notes = await Promise.allSettled(promises);

                const new_promises = [];
                notes.forEach((result, index) => {
                        if (result.status !== 'fulfilled' || !result.value) return;
                        const note = result.value;
                        const item = items[index];
                        if (!item.parentID)
                        {
                            const collections = item.getCollections();
                            let find_col = collections.find((c) => c == selected_collection);
                            if (!find_col) find_col = collections[0];

                            note.addToCollection(find_col);
                            new_promises.push(note.saveTx());
                        }
                    });

                await Promise.allSettled(new_promises);

                return items;
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
            case this.Commands.AnnotationToNote.COMMAND_NAME:
                return new this.Commands.AnnotationToNote(obj);
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

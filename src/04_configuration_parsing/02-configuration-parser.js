var ConfigurationParser = class {
    /**
     * Parses custom configuration for file naming and pathing.
     *
     * @param {string} configuration - The configuration string to parse.
     * @param zotMoovDebugger {ZotMoovDebugger} - The ZotMoovDebugger instance.
     * @param get_template_possibilities {GetItemTemplatePossibilities} - The class to get the template possibilities.
     */
    // Hoorn note: At the time of writing this, not entirely sure if this description of the responsibility is accurate.
    constructor(configuration, zotMoovDebugger, get_template_possibilities) {
        this._configuration = configuration;
        this._debugger = zotMoovDebugger;
        this._blockChooser = new BlockChooser();
        this._get_template_possibilities = get_template_possibilities;
    }

    /**
     * Parses the configuration string for the given item.
     * @param item {Item} - The item to parse.
     * @returns {string}
     */
    parse(item) {
        if (item.is_attachment && item.parent_item) {
            item = item.parent_item;
        }

        this._debugger.debug("Parsing configuration for item " + item.title_cleaned);
        this._debugger.debug("Configuration: " + this._configuration);

        let template = this._configuration;
        const template_possibilities = this._get_template_possibilities.get_template_possibilities(item);
        const raw_blocks = this._get_raw_blocks();

        for (let raw_block of raw_blocks) {
            this._debugger.debug("Parsing raw block: " + raw_block);

            const matchedConfigs = this._get_matched_configs(raw_block, template_possibilities);
            const blockSubstitution = this._blockChooser.get_block(raw_block, matchedConfigs);

            template = template.replace(raw_block, blockSubstitution.substitute(raw_block));
        }

        this._debugger.debug("Final configuration: " + template);

        return template;
    }

    /**
     * @returns {string[]} - The raw template blocks within the configuration string.
     * @private
     */
    _get_raw_blocks() {
        let blocks = [];

        let currentBlock = "";

        for (let character of this._configuration) {
            if (character === '{') {
                blocks.push(currentBlock);
                currentBlock = "";
                currentBlock += character;
                continue;
            }

            if (character === '}') {
                currentBlock += character;
                blocks.push(currentBlock);
                currentBlock = "";
                continue;
            }

            currentBlock += character;
        }

        blocks.push(currentBlock);

        return blocks;
    }

    /**
     * @param raw_block {string} - The raw template block to parse.
     * @param template_possibilities {TemplatePossibility[]} - The template possibilities to match against.
     * @returns {TemplatePossibility[]} - The found template possibilities.
     * @private
     */
    _get_matched_configs(raw_block, template_possibilities) {
        const sub_strings = this._get_sub_strings(raw_block);
        const matched_configs = [];

        for (let template_possibility of template_possibilities) {
            for (let sub_string of sub_strings) {
                // this._debugger.debug("Looking for sub_string: " + sub_string);

                if (template_possibility.search === sub_string) {
                    // this._debugger.debug("Found match: " + template_possibility.search);
                    matched_configs.push(template_possibility);
                }
            }
        }

        return matched_configs;
    }

    /**
     * @param raw_block {string} - The raw template block to parse.
     * @returns {string[]} - The found configurations.
     * @private
     */
    _get_sub_strings(raw_block) {
        let sub_strings = [];

        for (let i = 0; i < raw_block.length; i++) {
            const character = raw_block[i];

            if (character === '%') {
                sub_strings.push(raw_block.slice(i, i + 2));
                i += 2;
            }
        }

        return sub_strings;
    }
}
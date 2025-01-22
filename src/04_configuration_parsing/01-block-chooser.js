var BlockChooser = class {
    /**
     * @param raw_block {string}
     * @param template_possibilities {TemplatePossibility[]}
     * @returns {BlockInterface}
     */
    get_block(raw_block, template_possibilities) {
        if (raw_block.indexOf("|") !== -1){
            return new OptionalBlock(template_possibilities)
        }
        if (raw_block.startsWith("{") && raw_block.endsWith("}")) {
            return new ConditionalBlock(template_possibilities)
        }

        return new DefaultBlock(template_possibilities)
    }
}


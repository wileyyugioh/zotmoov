var InitialFormattingStrategy = class extends FormattingStrategyInterface {
    formatCreator(creator) {
        return creator.initials;
    }
}
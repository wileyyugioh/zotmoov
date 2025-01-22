var LastFirstInitialFormattingStrategy = class extends FormattingStrategyInterface {
    formatCreator(creator) {
        return creator.lastName + creator.firstName[0].toUpperCase()
    }
}


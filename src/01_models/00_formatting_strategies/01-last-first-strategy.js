var LastFirstFormattingStrategy = class extends FormattingStrategyInterface {
    formatCreator(creator) {
        return creator.lastName + ', ' + creator.firstName;
    }
}
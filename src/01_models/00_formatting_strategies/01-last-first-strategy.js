class LastFirstFormattingStrategy extends FormattingStrategyInterface {
    formatCreator(creator) {
        return creator.lastName + ', ' + creator.firstName;
    }
}
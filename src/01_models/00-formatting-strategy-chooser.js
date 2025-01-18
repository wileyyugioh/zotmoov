/**
 * Chooses a strategy based on the given desired strategy.
 */
class FormattingStrategyChooser {
    /**
     * Retrieves the desired formatting strategy based on the given desired strategy.
     *
     * @param {CreatorFormattingType} desired_strategy - The desired formatting strategy.
     *
     * @returns {FormattingStrategyInterface} The formatting strategy object.
     */
    getStrategy(desired_strategy) {
        switch (desired_strategy) {
            case CreatorFormattingType.LastFirst:
                return new LastFirstFormattingStrategy();
            case CreatorFormattingType.LastFirstInitial:
                return new LastFirstInitialFormattingStrategy();
            case CreatorFormattingType.Initial:
                return new InitialFormattingStrategy();
            case CreatorFormattingType.LastName:
                return new LastNameFormattingStrategy();
            default:
                throw new Error(`Unknown formatting strategy: ${desired_strategy}`);
        }
    }
}

class TitleCleaner {
    /**
     * Truncates the title based on a plethora of rules.
     * @param max_title_length {int} The max number of characters for a title.
     */
    constructor(max_title_length = 200) {
        this.max_title_length = max_title_length;
    }

    // Note from Hoorn: Why do we not use the sanitizer? What is the difference?
    truncateTitle(title) {
        let cleanedTitle = this.replaceForbiddenCharacters(title);
        cleanedTitle = this.truncateAtFirstSpecialCharacter(cleanedTitle);

        if (cleanedTitle.length > this.max_title_length) {
            cleanedTitle = cleanedTitle.substring(0, this.max_title_length);
            cleanedTitle = this.trimTruncatedTitle(cleanedTitle);

            return cleanedTitle;
        }

        cleanedTitle = this.removeEndingSpecialChars(cleanedTitle);

        return cleanedTitle;
    }

    removeEndingSpecialChars(title) {
        const specialChars = [':', '?', '.', '/', '\\', '>', '<', '*', '|'];
        const endChar = title.slice(-1);

        if (specialChars.includes(endChar)) {
            return  title.substring(0, title.length - 1);
        }

        return title;
    }

    trimTruncatedTitle(title) {
        const before_trunc_char = title.charAt(this.max_title_length);

        let trimmedTitle = title;

        if (trimmedTitle.search(" ") !== -1 && /[a-zA-Z0-9]/.test(before_trunc_char)) {
            while (trimmedTitle.charAt(title.length - 1) !== ' ') {
                trimmedTitle = title.substring(0, title.length - 1);
            }

            trimmedTitle = title.substring(0, title.length - 1);
        }

        return trimmedTitle;
    }

    // Note by Mr. Hoorn: not sure why this is necessary. It seems to me it's similar to replaceForbiddenCharacters()
    truncateAtFirstSpecialCharacter(title) {
        const truncate = title.search(/[:.?!]/);

        if(truncate !== -1) {
            return title.substring(0, truncate);
        }

        return title;
    }

    replaceForbiddenCharacters(title) {
        let cleanedTitle = title.replace(/[\/\\]/g, '-');
        cleanedTitle = cleanedTitle.replace(/[*|"<>]/g, '');
        cleanedTitle = cleanedTitle.replace(/[?:]/g, ' -');
        return cleanedTitle;
    }
}
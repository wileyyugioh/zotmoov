class CreatorModel {
    get creatorType() {
        return this._creatorType;
    }
    get initials() {
        return this._initials;
    }

    get firstName() {
        return this._firstName;
    }

    get lastName() {
        return this._lastName;
    }

    constructor(firstName, lastName, initials, creatorType) {
        this._firstName = firstName;
        this._lastName = lastName;
        this._initials = initials;
        this._creatorType = creatorType;
    }
}


/**
 * Class representing a factory for creating `CreatorModel` objects.
 */
class CreatorModelFactory {
    create(zoteroCreatorItem, creatorType) {
        const creatorInitials = zoteroCreatorItem.firstName[0].toUpperCase() + zoteroCreatorItem.lastName[0].toUpperCase();

        return new CreatorModel(
            zoteroCreatorItem.firstName,
            zoteroCreatorItem.lastName,
            creatorInitials,
            creatorType
        );
    }
}
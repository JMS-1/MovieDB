/// <reference path="uihelper.ts" />

// Pflegt die Vorgabeliste der Kategorien
class GenreEditor extends SuggestionListEditor<IGenreEditInfoContract, IGenreContract> {

    constructor(openButtonSelector: string, reloadApplicationData: () => void) {
        super(openButtonSelector, reloadApplicationData);
    }

    private static namePattern = /^[0-9A-Za-zäöüÄÖÜß]{1,20}$/;

    dialog(): JQuery {
        return $('#genreEditDialog');
    }

    controllerName(): string {
        return 'genre';
    }

    createNewOption(): string {
        return '(neue Kategorie anlegen)';
    }

    validateName(genre: IGenreContract): string {
        var name = genre.name;

        if (name.length < 1)
            return 'Es muss ein Name angegeben werden';
        else if (name.length > 100)
            return 'Der Name darf maximal 100 Zeichen haben';
        else
            return null;
    }
}
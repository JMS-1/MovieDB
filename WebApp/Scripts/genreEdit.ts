/// <reference path='typings/jquery/jquery.d.ts' />
/// <reference path='typings/jqueryui/jqueryui.d.ts' />
/// <reference path='interfaces.ts' />
/// <reference path='uiHelper.ts' />

class GenreEditor extends SuggestionListEditor<IGenreEditInfo, IGenreContract> {

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
        return '(neue Art anlegen)';
    }

    validateName(genre: IGenreContract): string {
        var uniqueName = genre.id;

        if (!GenreEditor.namePattern.test(uniqueName))
            return 'Der Name muss aus 1 bis 20 Buchstaben oder Ziffern bestehen';
        else
            return null;
    }

    validateDescription(genre: IGenreContract): string {
        var description = genre.description;

        if (description.length < 1)
            return 'Es muss eine Beschreibung angegeben werden';
        else if (description.length > 100)
            return 'Die Beschreibung darf maximal 100 Zeichen haben';
        else
            return null;
    }
}
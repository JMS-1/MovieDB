
// Pflegt die Vorgabeliste der Sprachen
class LanguageEditor extends SuggestionListEditor<ILanguageEditInfoContract, ILanguageContract> {

    constructor(openButtonSelector: string, reloadApplicationData: () => void) {
        super(openButtonSelector, reloadApplicationData);
    }

    private static namePattern = /^[a-z]{2}$/;

    dialog(): JQuery {
        return $('#languageEditDialog');
    }

    controllerName(): string {
        return 'language';
    }

    createNewOption(): string {
        return '(neue Sprache anlegen)';
    }

    validateName(language: ILanguageContract): string {
        var name = language.name;

        if (name.length < 1)
            return 'Es muss ein Name angegeben werden';
        else if (name.length > 100)
            return 'Der Name darf maximal 100 Zeichen haben';
        else
            return null;
    }
}
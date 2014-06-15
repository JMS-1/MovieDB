/// <reference path='typings/jquery/jquery.d.ts' />
/// <reference path='typings/jqueryui/jqueryui.d.ts' />
/// <reference path='interfaces.ts' />
/// <reference path='uiHelper.ts' />

class LanguageEditor extends SuggestionListEditor<ILanguageEditInfo, ILanguageContract> {

    constructor(openButtonSelector: string, reloadApplicationData: () => void) {
        super(openButtonSelector, reloadApplicationData);
    }

    private static namePattern = /^[a-z]{2}$/;

    dialog(): JQuery {
        return $('#languageEditDialog');
    }

    chooser(): JQuery {
        return $('#selectlanguageToEdit');
    }

    saveButton(): JQuery {
        return $('#languageDialogSave');
    }

    deleteButton(): JQuery {
        return $('#languageDialogDelete');
    }

    cancelButton(): JQuery {
        return $('#languageDialogCancel');
    }

    nameField(): JQuery {
        return $('#languageEditKey');
    }

    descriptionField(): JQuery {
        return $('#languageEditName');
    }

    controllerName(): string {
        return 'language';
    }

    createNewOption(): string {
        return '(neue Sprache anlegen)';
    }

    validateName(language: ILanguageContract): string {
        var uniqueName = language.id;

        if (!LanguageEditor.namePattern.test(uniqueName))
            return 'Das Kürzel muss aus genau 2 Buchstaben bestehen';
        else
            return null;
    }

    validateDescription(language: ILanguageContract): string {
        var description = language.description;

        if (description.length < 1)
            return 'Es muss eine Beschreibung angegeben werden';
        else if (description.length > 100)
            return 'Die Beschreibung darf maximal 100 Zeichen haben';
        else
            return null;
    }
}
/// <reference path='typings/jquery/jquery.d.ts' />
/// <reference path='typings/jqueryui/jqueryui.d.ts' />
/// <reference path='interfaces.ts' />
/// <reference path='uiHelper.ts' />

class SuggestionListEditor {
    constructor(openButtonSelector: string, reloadApplicationData: () => void) {
        this.reload = reloadApplicationData;

        $(openButtonSelector).click(() => this.open());

        this.cancelButton().click(() => this.close());
    }

    private reload: () => void;

    close() {
        this.dialog().dialog('close');
    }

    restart(): void {
        this.close();
        this.reload();
    }

    open(): void {
    }

    dialog(): JQuery {
        return null;
    }

    chooser(): JQuery {
        return null;
    }

    saveButton(): JQuery {
        return null;
    }

    deleteButton(): JQuery {
        return null;
    }

    cancelButton(): JQuery {
        return null;
    }

}

class GenreEditor extends SuggestionListEditor {

    dialog(): JQuery {
        return $('#genreEditDialog');
    }

    chooser(): JQuery {
        return $('#selectGenreToEdit');
    }

    saveButton(): JQuery {
        return $('#genreDialogSave');
    }

    deleteButton(): JQuery {
        return $('#genreDialogDelete');
    }

    cancelButton(): JQuery {
        return $('#genreDialogCancel');
    }

    private nameField(): JQuery {
        return $('#genreEditKey');
    }

    private descriptionField(): JQuery {
        return $('#genreEditName');
    }

    constructor(openButtonSelector: string, reloadApplicationData: () => void) {
        super(openButtonSelector, reloadApplicationData);

        this.saveButton().click(() => this.save());
        this.deleteButton().click(() => this.remove());

        this.chooser().change(() => this.choose());
        this.descriptionField().on('change', () => this.validate());
        this.descriptionField().on('input', () => this.validate());
        this.nameField().on('change', () => this.validate());
        this.nameField().on('input', () => this.validate());
    }

    private createNewGenre: boolean = null;

    private static namePattern = /^[0-9A-Za-zäöüÄÖÜß]{1,20}$/;

    reset(genres: IGenreContract[]): void {
        var chooser = this.chooser();

        chooser.empty();

        $(new Option('(neue Art anlegen)', '', true, true)).appendTo(chooser);

        $.each(genres, (index, genre) => $(new Option(genre.description, genre.id)).appendTo(chooser));
    }

    open(): void {
        this.choose();

        this.dialog().dialog({
            position: { of: '#dialogAnchor', at: 'center top+20', my: 'center top' },
            closeOnEscape: false,
            width: 'auto',
            modal: true,
        });
    }

    private createUpdate(): IGenreContract {
        var newData: IGenreContract =
            {
                description: this.descriptionField().val().trim(),
                id: this.nameField().val().trim(),
            };

        return newData;
    }

    private remove(): void {
        if (this.createNewGenre == null)
            return;
        if (this.createNewGenre)
            return;

        var newData = this.createUpdate();

        $
            .ajax('movie/genre/' + newData.id, {
                type: 'DELETE',
            })
            .done(() => this.restart())
            .fail(() => {
                alert('Da ist leider etwas schief gegangen');
            });
    }

    private save(): void {
        if (this.createNewGenre == null)
            return;

        var newData = this.createUpdate();

        if (!this.validate(newData))
            return;

        var url = 'movie/genre';
        if (!this.createNewGenre)
            url += '/' + newData.id;

        // Absenden und erst einmal nichts weiter tun
        $
            .ajax(url, {
                type: this.createNewGenre ? 'POST' : 'PUT',
                contentType: 'application/json; charset=utf-8',
                data: JSON.stringify(newData),
            })
            .done(() => this.restart())
            .fail(() => {
                alert('Da ist leider etwas schief gegangen');
            });
    }

    private validateName(genre: IGenreContract): string {
        var uniqueName = genre.id;

        if (!GenreEditor.namePattern.test(uniqueName))
            return 'Der Name muss aus 1 bis 20 Buchstaben oder Ziffern bestehen';
        else
            return null;
    }

    private validateDescription(genre: IGenreContract): string {
        var description = genre.description;

        if (description.length < 1)
            return 'Es muss eine Beschreibung angegeben werden';
        else if (description.length > 100)
            return 'Die Beschreibung darf maximal 100 Zeichen haben';
        else
            return null;
    }

    private validate(genre: IGenreContract = null): boolean {
        if (genre == null)
            genre = this.createUpdate();

        var isValid = true;

        if (Tools.setError(this.nameField(), this.validateName(genre)))
            isValid = false;
        if (Tools.setError(this.descriptionField(), this.validateDescription(genre)))
            isValid = false;

        this.saveButton().button('option', 'disabled', !isValid);

        return isValid;
    }

    private choose(): void {
        var choosen: string = this.chooser().val();

        this.saveButton().button('option', 'disabled', choosen.length > 0);
        this.deleteButton().button('option', 'disabled', true);

        this.nameField().prop('disabled', choosen.length > 0);
        this.nameField().val('');
        this.descriptionField().val('');

        if (choosen.length < 1) {
            this.createNewGenre = true;

            this.validate();
        }
        else {
            this.createNewGenre = null;

            $.ajax('movie/genre/' + choosen).done((info: IGenreEditInfo) => {
                if (info == null)
                    return;

                this.createNewGenre = false;

                this.nameField().val(info.id);
                this.descriptionField().val(info.name);

                this.deleteButton().button('option', 'disabled', !info.unused);

                this.validate();
            });
        }
    }
}
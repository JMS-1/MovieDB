/// <reference path='typings/jquery/jquery.d.ts' />
/// <reference path='typings/jqueryui/jqueryui.d.ts' />
/// <reference path='interfaces.ts' />

class GenreEditor {

    private static dialog(): JQuery {
        return $('#genreEditDialog');
    }

    private static genreChooser(): JQuery {
        return $('#selectGenreToEdit');
    }

    private static nameField(): JQuery {
        return $('#genreEditKey');
    }

    private static descriptionField(): JQuery {
        return $('#genreEditName');
    }

    constructor(openButtonSelector: string) {
        $(openButtonSelector).click(() => this.open());

        GenreEditor.genreChooser().change(() => this.choose());
    }

    reset(genres: IGenreContract[]): void {
        var chooser = GenreEditor.genreChooser();

        chooser.empty();

        $(new Option('(neue Art anlegen)', '', true, true)).appendTo(chooser);

        $.each(genres, (index, genre) => $(new Option(genre.description, genre.id)).appendTo(chooser));
    }

    private open(): void {
        this.choose();

        GenreEditor.dialog().dialog({ modal: true, width: '80%' });
    }

    private validate(): void {
    }

    private choose(): void {
        GenreEditor.nameField().val('');
        GenreEditor.descriptionField().val('');

        var choosen: string = GenreEditor.genreChooser().val();

        if (choosen.length > 0)
            $.ajax('movie/genre/' + choosen).done((info: IGenreEditInfo) => {
                if (info == null)
                    return;

                GenreEditor.nameField().val(info.id);
                GenreEditor.descriptionField().val(info.name);
            });
    }
}
/// <reference path='typings/jquery/jquery.d.ts' />
/// <reference path='typings/jqueryui/jqueryui.d.ts' />
/// <reference path='interfaces.ts' />
var GenreEditor = (function () {
    function GenreEditor(openButtonSelector) {
        var _this = this;
        $(openButtonSelector).click(function () {
            return _this.open();
        });

        GenreEditor.genreChooser().change(function () {
            return _this.choose();
        });
    }
    GenreEditor.dialog = function () {
        return $('#genreEditDialog');
    };

    GenreEditor.genreChooser = function () {
        return $('#selectGenreToEdit');
    };

    GenreEditor.nameField = function () {
        return $('#genreEditKey');
    };

    GenreEditor.descriptionField = function () {
        return $('#genreEditName');
    };

    GenreEditor.prototype.reset = function (genres) {
        var chooser = GenreEditor.genreChooser();

        chooser.empty();

        $(new Option('(neue Art anlegen)', '', true, true)).appendTo(chooser);

        $.each(genres, function (index, genre) {
            return $(new Option(genre.description, genre.id)).appendTo(chooser);
        });
    };

    GenreEditor.prototype.open = function () {
        this.choose();

        GenreEditor.dialog().dialog({ modal: true, width: '80%' });
    };

    GenreEditor.prototype.validate = function () {
    };

    GenreEditor.prototype.choose = function () {
        GenreEditor.nameField().val('');
        GenreEditor.descriptionField().val('');

        var choosen = GenreEditor.genreChooser().val();

        if (choosen.length > 0)
            $.ajax('movie/genre/' + choosen).done(function (info) {
                if (info == null)
                    return;

                GenreEditor.nameField().val(info.id);
                GenreEditor.descriptionField().val(info.name);
            });
    };
    return GenreEditor;
})();
//# sourceMappingURL=genreEdit.js.map

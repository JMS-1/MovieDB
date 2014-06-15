/// <reference path='typings/jquery/jquery.d.ts' />
/// <reference path='typings/jqueryui/jqueryui.d.ts' />
/// <reference path='interfaces.ts' />
/// <reference path='uiHelper.ts' />
var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var GenreEditor = (function (_super) {
    __extends(GenreEditor, _super);
    function GenreEditor(openButtonSelector, reloadApplicationData) {
        _super.call(this, openButtonSelector, reloadApplicationData);
    }
    GenreEditor.prototype.dialog = function () {
        return $('#genreEditDialog');
    };

    GenreEditor.prototype.chooser = function () {
        return $('#selectGenreToEdit');
    };

    GenreEditor.prototype.saveButton = function () {
        return $('#genreDialogSave');
    };

    GenreEditor.prototype.deleteButton = function () {
        return $('#genreDialogDelete');
    };

    GenreEditor.prototype.cancelButton = function () {
        return $('#genreDialogCancel');
    };

    GenreEditor.prototype.nameField = function () {
        return $('#genreEditKey');
    };

    GenreEditor.prototype.descriptionField = function () {
        return $('#genreEditName');
    };

    GenreEditor.prototype.controllerName = function () {
        return 'genre';
    };

    GenreEditor.prototype.createNewOption = function () {
        return '(neue Art anlegen)';
    };

    GenreEditor.prototype.validateName = function (genre) {
        var uniqueName = genre.id;

        if (!GenreEditor.namePattern.test(uniqueName))
            return 'Der Name muss aus 1 bis 20 Buchstaben oder Ziffern bestehen';
        else
            return null;
    };

    GenreEditor.prototype.validateDescription = function (genre) {
        var description = genre.description;

        if (description.length < 1)
            return 'Es muss eine Beschreibung angegeben werden';
        else if (description.length > 100)
            return 'Die Beschreibung darf maximal 100 Zeichen haben';
        else
            return null;
    };
    GenreEditor.namePattern = /^[0-9A-Za-zäöüÄÖÜß]{1,20}$/;
    return GenreEditor;
})(SuggestionListEditor);
//# sourceMappingURL=genreEdit.js.map

/// <reference path="uihelper.ts" />
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
// Pflegt die Vorgabeliste der Kategorien
var GenreEditor = (function (_super) {
    __extends(GenreEditor, _super);
    function GenreEditor(openButtonSelector, reloadApplicationData) {
        _super.call(this, openButtonSelector, reloadApplicationData);
    }
    GenreEditor.prototype.dialog = function () {
        return $('#genreEditDialog');
    };
    GenreEditor.prototype.controllerName = function () {
        return 'genre';
    };
    GenreEditor.prototype.createNewOption = function () {
        return '(neue Kategorie anlegen)';
    };
    GenreEditor.prototype.validateName = function (genre) {
        var name = genre.name;
        if (name.length < 1)
            return 'Es muss ein Name angegeben werden';
        else if (name.length > 100)
            return 'Der Name darf maximal 100 Zeichen haben';
        else
            return null;
    };
    return GenreEditor;
}(SuggestionListEditor));
//# sourceMappingURL=genreEdit.js.map
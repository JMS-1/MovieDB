var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
// Pflegt die Vorgabeliste der Sprachen
var LanguageEditor = (function (_super) {
    __extends(LanguageEditor, _super);
    function LanguageEditor(openButtonSelector, reloadApplicationData) {
        _super.call(this, openButtonSelector, reloadApplicationData);
    }
    LanguageEditor.prototype.dialog = function () {
        return $('#languageEditDialog');
    };

    LanguageEditor.prototype.controllerName = function () {
        return 'language';
    };

    LanguageEditor.prototype.createNewOption = function () {
        return '(neue Sprache anlegen)';
    };

    LanguageEditor.prototype.validateName = function (language) {
        var name = language.name;

        if (name.length < 1)
            return 'Es muss ein Name angegeben werden';
        else if (name.length > 100)
            return 'Der Name darf maximal 100 Zeichen haben';
        else
            return null;
    };
    LanguageEditor.namePattern = /^[a-z]{2}$/;
    return LanguageEditor;
})(SuggestionListEditor);
//# sourceMappingURL=languageEdit.js.map

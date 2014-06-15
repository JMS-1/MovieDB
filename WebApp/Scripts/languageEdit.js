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
        var uniqueName = language.id;

        if (!LanguageEditor.namePattern.test(uniqueName))
            return 'Das Kürzel muss aus genau 2 Buchstaben bestehen';
        else
            return null;
    };

    LanguageEditor.prototype.validateDescription = function (language) {
        var description = language.description;

        if (description.length < 1)
            return 'Es muss eine Beschreibung angegeben werden';
        else if (description.length > 100)
            return 'Die Beschreibung darf maximal 100 Zeichen haben';
        else
            return null;
    };
    LanguageEditor.namePattern = /^[a-z]{2}$/;
    return LanguageEditor;
})(SuggestionListEditor);
//# sourceMappingURL=languageEdit.js.map

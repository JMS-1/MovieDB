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
var SuggestionListEditor = (function () {
    function SuggestionListEditor(openButtonSelector, reloadApplicationData) {
        var _this = this;
        this.reload = reloadApplicationData;

        $(openButtonSelector).click(function () {
            return _this.open();
        });

        this.cancelButton().click(function () {
            return _this.close();
        });
    }
    SuggestionListEditor.prototype.close = function () {
        this.dialog().dialog('close');
    };

    SuggestionListEditor.prototype.restart = function () {
        this.close();
        this.reload();
    };

    SuggestionListEditor.prototype.open = function () {
    };

    SuggestionListEditor.prototype.dialog = function () {
        return null;
    };

    SuggestionListEditor.prototype.chooser = function () {
        return null;
    };

    SuggestionListEditor.prototype.saveButton = function () {
        return null;
    };

    SuggestionListEditor.prototype.deleteButton = function () {
        return null;
    };

    SuggestionListEditor.prototype.cancelButton = function () {
        return null;
    };
    return SuggestionListEditor;
})();

var GenreEditor = (function (_super) {
    __extends(GenreEditor, _super);
    function GenreEditor(openButtonSelector, reloadApplicationData) {
        var _this = this;
        _super.call(this, openButtonSelector, reloadApplicationData);
        this.createNewGenre = null;

        this.saveButton().click(function () {
            return _this.save();
        });
        this.deleteButton().click(function () {
            return _this.remove();
        });

        this.chooser().change(function () {
            return _this.choose();
        });
        this.descriptionField().on('change', function () {
            return _this.validate();
        });
        this.descriptionField().on('input', function () {
            return _this.validate();
        });
        this.nameField().on('change', function () {
            return _this.validate();
        });
        this.nameField().on('input', function () {
            return _this.validate();
        });
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

    GenreEditor.prototype.reset = function (genres) {
        var chooser = this.chooser();

        chooser.empty();

        $(new Option('(neue Art anlegen)', '', true, true)).appendTo(chooser);

        $.each(genres, function (index, genre) {
            return $(new Option(genre.description, genre.id)).appendTo(chooser);
        });
    };

    GenreEditor.prototype.open = function () {
        this.choose();

        this.dialog().dialog({
            position: { of: '#dialogAnchor', at: 'center top+20', my: 'center top' },
            closeOnEscape: false,
            width: 'auto',
            modal: true
        });
    };

    GenreEditor.prototype.createUpdate = function () {
        var newData = {
            description: this.descriptionField().val().trim(),
            id: this.nameField().val().trim()
        };

        return newData;
    };

    GenreEditor.prototype.remove = function () {
        var _this = this;
        if (this.createNewGenre == null)
            return;
        if (this.createNewGenre)
            return;

        var newData = this.createUpdate();

        $.ajax('movie/genre/' + newData.id, {
            type: 'DELETE'
        }).done(function () {
            return _this.restart();
        }).fail(function () {
            alert('Da ist leider etwas schief gegangen');
        });
    };

    GenreEditor.prototype.save = function () {
        var _this = this;
        if (this.createNewGenre == null)
            return;

        var newData = this.createUpdate();

        if (!this.validate(newData))
            return;

        var url = 'movie/genre';
        if (!this.createNewGenre)
            url += '/' + newData.id;

        // Absenden und erst einmal nichts weiter tun
        $.ajax(url, {
            type: this.createNewGenre ? 'POST' : 'PUT',
            contentType: 'application/json; charset=utf-8',
            data: JSON.stringify(newData)
        }).done(function () {
            return _this.restart();
        }).fail(function () {
            alert('Da ist leider etwas schief gegangen');
        });
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

    GenreEditor.prototype.validate = function (genre) {
        if (typeof genre === "undefined") { genre = null; }
        if (genre == null)
            genre = this.createUpdate();

        var isValid = true;

        if (Tools.setError(this.nameField(), this.validateName(genre)))
            isValid = false;
        if (Tools.setError(this.descriptionField(), this.validateDescription(genre)))
            isValid = false;

        this.saveButton().button('option', 'disabled', !isValid);

        return isValid;
    };

    GenreEditor.prototype.choose = function () {
        var _this = this;
        var choosen = this.chooser().val();

        this.saveButton().button('option', 'disabled', choosen.length > 0);
        this.deleteButton().button('option', 'disabled', true);

        this.nameField().prop('disabled', choosen.length > 0);
        this.nameField().val('');
        this.descriptionField().val('');

        if (choosen.length < 1) {
            this.createNewGenre = true;

            this.validate();
        } else {
            this.createNewGenre = null;

            $.ajax('movie/genre/' + choosen).done(function (info) {
                if (info == null)
                    return;

                _this.createNewGenre = false;

                _this.nameField().val(info.id);
                _this.descriptionField().val(info.name);

                _this.deleteButton().button('option', 'disabled', !info.unused);

                _this.validate();
            });
        }
    };
    GenreEditor.namePattern = /^[0-9A-Za-zäöüÄÖÜß]{1,20}$/;
    return GenreEditor;
})(SuggestionListEditor);
//# sourceMappingURL=genreEdit.js.map

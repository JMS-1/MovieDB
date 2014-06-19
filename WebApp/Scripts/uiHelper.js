/// <reference path='typings/jquery/jquery.d.ts' />
/// <reference path='typings/jqueryui/jqueryui.d.ts' />
/// <reference path='interfaces.ts' />
var Styles = (function () {
    function Styles() {
    }
    Styles.invisble = 'invisible';

    Styles.loading = 'ui-icon-power';

    Styles.busy = 'ui-icon-refresh';

    Styles.idle = 'ui-icon-check';

    Styles.pageButton = 'pageButton';

    Styles.activePageButton = 'pageButtonSelected';

    Styles.disabledOption = 'disabledOption';

    Styles.notSorted = 'ui-icon-arrowthick-2-n-s';

    Styles.sortedUp = 'ui-icon-arrowthick-1-n';

    Styles.sortedDown = 'ui-icon-arrowthick-1-s';

    Styles.inputError = 'validationError';

    Styles.deleteConfirmation = 'deleteConfirm';
    return Styles;
})();

var Tools = (function () {
    function Tools() {
    }
    Tools.setError = function (field, message) {
        if (message == null) {
            field.removeClass(Styles.inputError);
            field.removeAttr('title');

            return false;
        } else {
            field.addClass(Styles.inputError);
            field.attr('title', message);

            return true;
        }
    };

    Tools.fillMappingSelection = function (selector, items, nullSelection) {
        Tools.fillSelection(selector, items, nullSelection, function (item) {
            return item.id;
        }, function (item) {
            return item.name;
        });
    };

    Tools.fillSeriesSelection = function (selector, series, nullSelection) {
        Tools.fillSelection(selector, series, nullSelection, function (s) {
            return s.id;
        }, function (s) {
            return s.hierarchicalName;
        });
    };

    Tools.fillSelection = function (selector, items, nullSelection, getValue, getText) {
        selector.empty();

        $('<option />', { text: nullSelection, value: '' }).appendTo(selector);

        $.each(items, function (index, item) {
            return $('<option />', { text: getText(item), value: getValue(item) }).appendTo(selector);
        });
    };

    Tools.openDialog = function (dialog) {
        dialog.dialog({
            position: { of: '#main', at: 'center top+100', my: 'center top' },
            closeOnEscape: false,
            width: 'auto',
            modal: true
        });
    };
    return Tools;
})();

var GenreSelector = (function () {
    function GenreSelector(genre, container, onChange) {
        var id = 'genreCheckbox' + genre.id;
        var block = $('<div class="withLabel" />').appendTo(container);

        this.checkbox = $('<input />', { type: 'checkbox', id: id, name: genre.id }).appendTo(block).change(onChange);
        this.label = $('<label />', { 'for': id, text: genre.name }).appendTo(block);
        this.description = genre.name;
    }
    GenreSelector.prototype.reset = function () {
        if (this.checkbox.prop('checked')) {
            this.label.removeClass(Styles.invisble);
            this.checkbox.removeClass(Styles.invisble);
        } else {
            this.label.addClass(Styles.invisble);
            this.checkbox.addClass(Styles.invisble);
        }
    };

    GenreSelector.prototype.setCount = function (count) {
        this.label.text(this.description + ' (' + count + ')');

        this.checkbox.removeClass(Styles.invisble);
        this.label.removeClass(Styles.invisble);
    };
    return GenreSelector;
})();

var GenreSelectors = (function () {
    function GenreSelectors(containerSelector) {
        this.genres = {};
        this.container = $(containerSelector);
    }
    GenreSelectors.prototype.initialize = function (genres, onChange) {
        var _this = this;
        this.container.empty();
        this.genres = {};

        $.each(genres, function (index, genre) {
            return _this.genres[genre.id] = new GenreSelector(genre, _this.container, onChange);
        });
    };

    GenreSelectors.prototype.setCounts = function (statistics) {
        var _this = this;
        $.each(this.genres, function (key, genre) {
            return genre.reset();
        });
        $.each(statistics, function (index, genre) {
            return _this.genres[genre.id].setCount(genre.count);
        });
    };

    GenreSelectors.prototype.resetFilter = function () {
        this.foreachSelected(function (checkbox) {
            return checkbox.prop('checked', false);
        });
    };

    GenreSelectors.prototype.foreachSelected = function (processor) {
        this.container.find('input[type=checkbox]:checked').each(function (index, checkbox) {
            return processor($(checkbox));
        });
    };
    return GenreSelectors;
})();

var LanguageSelector = (function () {
    function LanguageSelector(language, container) {
        var id = 'languageOption' + language.id;
        var block = $('<div class="withLabel" />').appendTo(container);

        this.radio = $('<input />', { type: 'radio', id: id, name: LanguageSelector.optionGroupName, value: language.id }).appendTo(block);
        this.label = $('<label />', { 'for': id, text: language.name }).appendTo(block);
        this.description = language.name;
    }
    LanguageSelector.prototype.reset = function () {
        if (this.radio.prop('checked')) {
            this.label.removeClass(Styles.invisble);
            this.radio.removeClass(Styles.invisble);
        } else {
            this.label.addClass(Styles.invisble);
            this.radio.addClass(Styles.invisble);
        }
    };

    LanguageSelector.prototype.setCount = function (count) {
        this.label.text(this.description + ' (' + count + ')');

        this.radio.removeClass(Styles.invisble);
        this.label.removeClass(Styles.invisble);
    };
    LanguageSelector.optionGroupName = 'languageChoice';
    return LanguageSelector;
})();

var LanguageSelectors = (function () {
    function LanguageSelectors(containerSelector) {
        this.languages = {};
        this.container = $(containerSelector);
    }
    LanguageSelectors.prototype.initialize = function (languages) {
        var _this = this;
        this.container.empty();
        this.languages = {};

        var block = $('<div class="withLabel" />').appendTo(this.container);
        $('<input />', { type: 'radio', id: 'anyLanguageChoice', name: LanguageSelector.optionGroupName, value: '', checked: 'checked' }).appendTo(block);
        $('<label />', { 'for': 'anyLanguageChoice', text: '(egal)' }).appendTo(block);

        $.each(languages, function (index, language) {
            return _this.languages[language.id] = new LanguageSelector(language, _this.container);
        });
    };

    LanguageSelectors.prototype.setCounts = function (statistics) {
        var _this = this;
        $.each(this.languages, function (key, language) {
            return language.reset();
        });
        $.each(statistics, function (index, language) {
            return _this.languages[language.id].setCount(language.count);
        });
    };

    LanguageSelectors.prototype.resetFilter = function () {
        this.container.find('input').first().prop('checked', true);
    };
    return LanguageSelectors;
})();

var SeriesSelectors = (function () {
    function SeriesSelectors(containerSelector) {
        this.container = $(containerSelector);
    }
    SeriesSelectors.prototype.resetFilter = function () {
        this.container.val(null);
    };

    SeriesSelectors.prototype.initialize = function (series) {
        Tools.fillSeriesSelection(this.container, series, '(egal)');
    };
    return SeriesSelectors;
})();

var MultiValueEditor = (function () {
    function MultiValueEditor(containerSelector, onChange) {
        this.onChange = onChange;

        this.container = $(containerSelector);
        this.container.buttonset();
    }
    MultiValueEditor.prototype.val = function (newVal) {
        if (newVal) {
            var map = {};
            $.each(newVal, function (index, id) {
                return map[id] = true;
            });

            $.each(this.container.find('input[type=checkbox]'), function (index, checkbox) {
                var selector = $(checkbox);

                selector.prop('checked', map[selector.val()] == true);
            });

            this.container.buttonset('refresh');

            return newVal;
        } else {
            var value = [];

            $.each(this.container.find('input[type=checkbox]:checked'), function (index, checkbox) {
                return value.push($(checkbox).val());
            });

            return value;
        }
    };

    MultiValueEditor.prototype.reset = function (items) {
        var _this = this;
        // Zuerst merken wir uns mal die aktuelle Einstellung
        var previousValue = this.val();

        // Dann wird die Oberfläche zurück gesetzt
        this.container.empty();

        // Und ganz neu aufgebaut
        $.each(items, function (index, item) {
            var id = "mve" + (++MultiValueEditor.idCounter);

            var checkbox = $('<input />', { type: 'checkbox', id: id, value: item.id }).appendTo(_this.container).click(function () {
                return _this.onChange();
            });
            var label = $('<label />', { 'for': id, text: item.name }).appendTo(_this.container);
        });

        // Alle Werte, die wir ausgewählt haben, werden wieder aktiviert - sofern sie bekannt sind
        this.val(previousValue);
    };
    MultiValueEditor.idCounter = 0;
    return MultiValueEditor;
})();

// Diese Basisklasse unterstützt die Pflege der festen Auswahllisten für Sprachen und Arten von Aufzeichnungen
var SuggestionListEditor = (function () {
    function SuggestionListEditor(openButtonSelector, reloadApplicationData) {
        var _this = this;
        this.identifier = null;
        this.reload = reloadApplicationData;

        this.confirmedDelete = new DeleteButton(this.dialog().find('.dialogDelete'), function () {
            return _this.remove();
        });

        $(openButtonSelector).click(function () {
            return _this.open();
        });

        this.saveButton().click(function () {
            return _this.save();
        });
        this.cancelButton().click(function () {
            return _this.close();
        });

        this.nameField().on('change', function () {
            return _this.validate();
        });
        this.nameField().on('input', function () {
            return _this.validate();
        });
        this.chooser().change(function () {
            return _this.choose();
        });
    }
    SuggestionListEditor.prototype.open = function () {
        // Vorher noch einmal schnell alles aufbereiten - eventuell erfolgt auch ein Aufruf an den Web Service
        this.choose();

        Tools.openDialog(this.dialog());
    };

    SuggestionListEditor.prototype.close = function () {
        this.dialog().dialog('close');
    };

    SuggestionListEditor.prototype.restart = function () {
        this.close();

        // Wichtig ist, dass wir die neuen Listen in die Oberfläche laden
        this.reload();
    };

    SuggestionListEditor.prototype.createUpdate = function () {
        var newData = {
            name: (this.nameField().val() || '').trim(),
            id: null
        };

        // Der Downcast ist etwas unsauber, aber wir wissen hier genau, was wir tun
        return newData;
    };

    SuggestionListEditor.prototype.reset = function (list) {
        Tools.fillSelection(this.chooser(), list, this.createNewOption(), function (i) {
            return i.id;
        }, function (i) {
            return i.name;
        });
    };

    SuggestionListEditor.prototype.validate = function (newData) {
        if (typeof newData === "undefined") { newData = null; }
        if (newData == null)
            newData = this.createUpdate();

        var isValid = true;

        if (Tools.setError(this.nameField(), this.validateName(newData)))
            isValid = false;

        this.saveButton().button('option', 'disabled', !isValid);

        return isValid;
    };

    SuggestionListEditor.prototype.choose = function () {
        var _this = this;
        // Die aktuelle Auswahl ermitteln
        var choosen = this.chooser().val();

        // Und dann ganz defensiv erst einmal alles zurück setzen
        this.saveButton().button('option', 'disabled', choosen.length > 0);

        this.confirmedDelete.disable();

        this.nameField().val('');

        if (choosen.length < 1) {
            // Einfach ist es, wenn wir etwas neu Anlegen
            this.identifier = '';

            this.validate();
        } else {
            // Ansonsten fragen wir den Web Service immer nach dem neuesten Stand
            this.identifier = null;

            $.ajax('movie/' + this.controllerName() + '/' + choosen).done(function (info) {
                if (info == null)
                    return;

                _this.identifier = info.id;

                _this.nameField().val(info.name);

                if (info.unused)
                    _this.confirmedDelete.enable();

                // Für den unwahrscheinlichen Fall, dass sich die Spielregeln verändert haben - und um die Schaltfläche zum Speichern zu aktivieren
                _this.validate();
            });
        }
    };

    SuggestionListEditor.prototype.remove = function () {
        var _this = this;
        if (this.identifier == null)
            return;
        if (this.identifier.length < 1)
            return;

        $.ajax('movie/' + this.controllerName() + '/' + this.identifier, {
            type: 'DELETE'
        }).done(function () {
            return _this.restart();
        }).fail(function () {
            // Bei der Fehlerbehandlung ist noch Potential
            alert('Da ist leider etwas schief gegangen');
        });
    };

    SuggestionListEditor.prototype.save = function () {
        var _this = this;
        if (this.identifier == null)
            return;

        var newData = this.createUpdate();

        // Vorsichtshalbe schauen wir noch einmal nach, ob das alles so in Ordnung geht
        if (!this.validate(newData))
            return;

        var url = 'movie/' + this.controllerName();
        if (this.identifier.length > 0)
            url += '/' + this.identifier;

        $.ajax(url, {
            type: (this.identifier.length < 1) ? 'POST' : 'PUT',
            contentType: 'application/json; charset=utf-8',
            data: JSON.stringify(newData)
        }).done(function () {
            return _this.restart();
        }).fail(function () {
            // Bei der Fehlerbehandlung ist noch Potential
            alert('Da ist leider etwas schief gegangen');
        });
    };

    // Alles was jetzt kommt sind eigentlich die abstrakten Methoden der Basisklasse
    SuggestionListEditor.prototype.controllerName = function () {
        throw 'Bitte controllerName implementieren';
    };

    SuggestionListEditor.prototype.createNewOption = function () {
        throw 'Bitte createNewOption implementieren';
    };

    SuggestionListEditor.prototype.dialog = function () {
        throw 'Bitte dialog implementieren';
    };

    SuggestionListEditor.prototype.chooser = function () {
        return this.dialog().find('.selectKey');
    };

    SuggestionListEditor.prototype.saveButton = function () {
        return this.dialog().find('.dialogSave');
    };

    SuggestionListEditor.prototype.cancelButton = function () {
        return this.dialog().find('.dialogCancel');
    };

    SuggestionListEditor.prototype.nameField = function () {
        return this.dialog().find('.editName');
    };

    SuggestionListEditor.prototype.validateName = function (newData) {
        throw 'Bitte validateName implementieren';
    };
    return SuggestionListEditor;
})();

var DeleteButton = (function () {
    function DeleteButton(button, process) {
        var _this = this;
        this.button = button.click(function () {
            return _this.remove();
        });
        this.process = process;
    }
    DeleteButton.prototype.disable = function () {
        this.button.removeClass(Styles.deleteConfirmation);
        this.button.button('option', 'disabled', true);
    };

    DeleteButton.prototype.enable = function () {
        this.button.button('option', 'disabled', false);
    };

    DeleteButton.prototype.remove = function () {
        if (this.button.hasClass(Styles.deleteConfirmation))
            this.process();
        else
            this.button.addClass(Styles.deleteConfirmation);
    };
    return DeleteButton;
})();
//# sourceMappingURL=uiHelper.js.map

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
    return Tools;
})();

var GenreSelector = (function () {
    function GenreSelector(genre, container, onChange) {
        var id = 'genreCheckbox' + genre.id;
        var block = $('<div class="withLabel" />').appendTo(container);

        this.checkbox = $('<input />', { type: 'checkbox', id: id, name: genre.id }).appendTo(block).change(onChange);
        this.label = $('<label />', { 'for': id, text: genre.description }).appendTo(block);
        this.description = genre.description;
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
        this.label = $('<label />', { 'for': id, text: language.description }).appendTo(block);
        this.description = language.description;
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
        var _this = this;
        this.container.empty();
        this.container.append(new Option('(egal)', ''));

        $.each(series, function (index, mapping) {
            return $(new Option(mapping.hierarchicalName, mapping.id)).appendTo(_this.container);
        });
    };
    return SeriesSelectors;
})();

var MultiValueEditor = (function () {
    function MultiValueEditor(containerSelector, onChange) {
        this.onChange = onChange;

        this.container = $(containerSelector);
        this.container.buttonset();
    }
    MultiValueEditor.prototype.value = function (newVal) {
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

    MultiValueEditor.prototype.reset = function (items, idSelector, nameSelector) {
        var _this = this;
        // Zuerst merken wir uns mal die aktuelle Einstellung
        var previousValue = this.value();

        // Dann wird die Oberfläche zurück gesetzt
        this.container.empty();

        // Und ganz neu aufgebaut
        $.each(items, function (index, item) {
            var id = "mve" + (++MultiValueEditor.idCounter);

            var checkbox = $('<input />', { type: 'checkbox', id: id, value: idSelector(item) }).appendTo(_this.container).click(function () {
                return _this.onChange();
            });
            var label = $('<label />', { 'for': id, text: nameSelector(item) }).appendTo(_this.container);
        });

        // Alle Werte, die wir ausgewählt haben, werden wieder aktiviert - sofern sie bekannt sind
        this.value(previousValue);
    };
    MultiValueEditor.idCounter = 0;
    return MultiValueEditor;
})();
//# sourceMappingURL=uiHelper.js.map

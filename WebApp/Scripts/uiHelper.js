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
    return Styles;
})();

var GenreSelector = (function () {
    function GenreSelector(genre, container, onChange) {
        var id = 'genreCheckbox' + genre.id;

        this.checkbox = $('<input />', { type: 'checkbox', id: id, name: genre.id }).appendTo(container).change(onChange);
        this.label = $('<label />', { 'for': id, text: genre.description }).appendTo(container);
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

    GenreSelectors.prototype.setCount = function (statistics) {
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
        this.container.children('input[type=checkbox]:checked').each(function (index, checkbox) {
            return processor($(checkbox));
        });
    };
    return GenreSelectors;
})();

var LanguageSelector = (function () {
    function LanguageSelector(language, container) {
        var id = 'languageOption' + language.id;

        this.radio = $('<input />', { type: 'radio', id: id, name: LanguageSelector.optionGroupName, value: language.id }).appendTo(container);
        this.label = $('<label />', { 'for': id, text: language.description }).appendTo(container);
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

        $('<input />', { type: 'radio', id: 'anyLanguageChoice', name: LanguageSelector.optionGroupName, value: '', checked: 'checked' }).appendTo(this.container);
        $('<label />', { 'for': 'anyLanguageChoice', text: '(egal)' }).appendTo(this.container);

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
        this.container.children().first().prop('checked', true);
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
//# sourceMappingURL=uiHelper.js.map

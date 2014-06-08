/// <reference path='typings/jquery/jquery.d.ts' />
/// <reference path='typings/jqueryui/jqueryui.d.ts' />
/// <reference path='interfaces.ts' />
var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
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

var OptionSelector = (function () {
    function OptionSelector(id, description, container) {
        this.option = $(new Option(description, id)).appendTo(container);
        this.description = description;
    }
    OptionSelector.prototype.reset = function () {
        this.option.addClass(Styles.disabledOption);
        this.option.text(this.description + ' (0)');
    };

    OptionSelector.prototype.setCount = function (count) {
        this.option.text(this.description + ' (' + count + ')');
        this.option.removeClass(Styles.disabledOption);
    };
    return OptionSelector;
})();

var OptionSelectors = (function () {
    function OptionSelectors(containerSelector) {
        this.options = {};
        this.container = $(containerSelector);
    }
    OptionSelectors.prototype.preInitialize = function (items, idSelector, nameSelector) {
        var _this = this;
        this.container.empty();
        this.options = {};

        this.container.append(new Option('(egal)', ''));

        $.each(items, function (index, item) {
            return _this.options[item.id] = new OptionSelector(idSelector(item), nameSelector(item), _this.container);
        });
    };

    OptionSelectors.prototype.resetFilter = function () {
        this.container.val(null);
    };

    OptionSelectors.prototype.setCount = function (statistics) {
        var _this = this;
        $.each(this.options, function (key, item) {
            return item.reset();
        });
        $.each(statistics, function (index, item) {
            return _this.options[item.id].setCount(item.count);
        });
    };
    return OptionSelectors;
})();

var LanguageSelectors = (function (_super) {
    __extends(LanguageSelectors, _super);
    function LanguageSelectors() {
        _super.apply(this, arguments);
    }
    LanguageSelectors.prototype.initialize = function (languages) {
        this.preInitialize(languages, function (language) {
            return language.id;
        }, function (language) {
            return language.description;
        });
    };
    return LanguageSelectors;
})(OptionSelectors);

var SeriesSelectors = (function (_super) {
    __extends(SeriesSelectors, _super);
    function SeriesSelectors() {
        _super.apply(this, arguments);
    }
    SeriesSelectors.prototype.initialize = function (series) {
        this.preInitialize(series, function (mapping) {
            return mapping.id;
        }, function (mapping) {
            return mapping.hierarchicalName;
        });
    };
    return SeriesSelectors;
})(OptionSelectors);
//# sourceMappingURL=uiHelper.js.map

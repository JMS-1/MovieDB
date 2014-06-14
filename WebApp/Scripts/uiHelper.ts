/// <reference path='typings/jquery/jquery.d.ts' />
/// <reference path='typings/jqueryui/jqueryui.d.ts' />
/// <reference path='interfaces.ts' />

class Styles {
    static invisble = 'invisible';

    static loading = 'ui-icon-power';

    static busy = 'ui-icon-refresh';

    static idle = 'ui-icon-check';

    static pageButton = 'pageButton';

    static activePageButton = 'pageButtonSelected';

    static disabledOption = 'disabledOption';

    static notSorted = 'ui-icon-arrowthick-2-n-s';

    static sortedUp = 'ui-icon-arrowthick-1-n';

    static sortedDown = 'ui-icon-arrowthick-1-s';

    static inputError = 'validationError';
}

class Tools {
    static setError(field: JQuery, message: string): boolean {
        if (message == null) {
            field.removeClass(Styles.inputError);
            field.removeAttr('title');

            return false;
        }
        else {
            field.addClass(Styles.inputError);
            field.attr('title', message);

            return true;
        }
    }
}

class GenreSelector {
    constructor(genre: IGenreContract, container: JQuery, onChange: () => void) {
        var id = 'genreCheckbox' + genre.id;
        var block = $('<div class="withLabel" />').appendTo(container);

        this.checkbox = $('<input />', { type: 'checkbox', id: id, name: genre.id }).appendTo(block).change(onChange);
        this.label = $('<label />', { 'for': id, text: genre.description }).appendTo(block);
        this.description = genre.description;
    }

    private checkbox: JQuery;

    private label: JQuery;

    private description: string;

    reset(): void {
        if (this.checkbox.prop('checked')) {
            this.label.removeClass(Styles.invisble);
            this.checkbox.removeClass(Styles.invisble);
        }
        else {
            this.label.addClass(Styles.invisble);
            this.checkbox.addClass(Styles.invisble);
        }
    }

    setCount(count: number): void {
        this.label.text(this.description + ' (' + count + ')');

        this.checkbox.removeClass(Styles.invisble);
        this.label.removeClass(Styles.invisble);
    }
}

class GenreSelectors {
    private genres: any = {};

    container: JQuery;

    constructor(containerSelector: string) {
        this.container = $(containerSelector);
    }

    initialize(genres: IGenreContract[], onChange: () => void): void {
        this.container.empty();
        this.genres = {};

        $.each(genres, (index, genre) => this.genres[genre.id] = new GenreSelector(genre, this.container, onChange));
    }

    setCounts(statistics: IGenreStatisticsContract[]): void {
        $.each(this.genres, (key, genre: GenreSelector) => genre.reset());
        $.each(statistics, (index, genre) => (<GenreSelector>this.genres[genre.id]).setCount(genre.count));
    }

    resetFilter(): void {
        this.foreachSelected(checkbox => checkbox.prop('checked', false));
    }

    foreachSelected(processor: (checkbox: JQuery) => void): void {
        this.container.find('input[type=checkbox]:checked').each((index, checkbox) => processor($(checkbox)));
    }
}

class LanguageSelector {
    static optionGroupName = 'languageChoice';

    constructor(language: ILanguageContract, container: JQuery) {
        var id = 'languageOption' + language.id;
        var block = $('<div class="withLabel" />').appendTo(container);

        this.radio = $('<input />', { type: 'radio', id: id, name: LanguageSelector.optionGroupName, value: language.id }).appendTo(block);
        this.label = $('<label />', { 'for': id, text: language.description }).appendTo(block);
        this.description = language.description;
    }

    private radio: JQuery;

    private label: JQuery;

    private description: string;

    reset(): void {
        if (this.radio.prop('checked')) {
            this.label.removeClass(Styles.invisble);
            this.radio.removeClass(Styles.invisble);
        }
        else {
            this.label.addClass(Styles.invisble);
            this.radio.addClass(Styles.invisble);
        }
    }

    setCount(count: number): void {
        this.label.text(this.description + ' (' + count + ')');

        this.radio.removeClass(Styles.invisble);
        this.label.removeClass(Styles.invisble);
    }
}

class LanguageSelectors {
    private languages: any = {};

    container: JQuery;

    constructor(containerSelector: string) {
        this.container = $(containerSelector);
    }

    initialize(languages: ILanguageContract[]): void {
        this.container.empty();
        this.languages = {};

        var block = $('<div class="withLabel" />').appendTo(this.container);
        $('<input />', { type: 'radio', id: 'anyLanguageChoice', name: LanguageSelector.optionGroupName, value: '', checked: 'checked' }).appendTo(block);
        $('<label />', { 'for': 'anyLanguageChoice', text: '(egal)' }).appendTo(block);

        $.each(languages, (index, language) => this.languages[language.id] = new LanguageSelector(language, this.container));
    }

    setCounts(statistics: ILanguageStatisticsContract[]): void {
        $.each(this.languages, (key, language: LanguageSelector) => language.reset());
        $.each(statistics, (index, language) => (<LanguageSelector>this.languages[language.id]).setCount(language.count));
    }

    resetFilter(): void {
        this.container.find('input').first().prop('checked', true);
    }
}

class SeriesSelectors {
    container: JQuery;

    constructor(containerSelector: string) {
        this.container = $(containerSelector);
    }

    resetFilter(): void {
        this.container.val(null);
    }

    initialize(series: ISeriesMappingContract[]): void {
        this.container.empty();
        this.container.append(new Option('(egal)', ''));

        $.each(series, (index, mapping) => $(new Option(mapping.hierarchicalName, mapping.id)).appendTo(this.container));
    }
}

class MultiValueEditor<T> {
    constructor(containerSelector: string, onChange: () => void) {
        this.onChange = onChange;

        this.container = $(containerSelector);
        this.container.buttonset();
    }

    private static idCounter = 0;

    private onChange: () => void;

    container: JQuery;

    value(): string[];

    value(newVal: string[]): void;

    value(newVal?: string[]): string[] {
        if (newVal) {
            var map = {};
            $.each(newVal, (index, id) => map[id] = true);

            $.each(this.container.find('input[type=checkbox]'), (index, checkbox: HTMLInputElement) => {
                var selector = $(checkbox);

                selector.prop('checked', map[selector.val()] == true);
            });

            this.container.buttonset('refresh');

            return newVal;
        } else {
            var value: string[] = [];

            $.each(this.container.find('input[type=checkbox]:checked'), (index, checkbox: HTMLInputElement) => value.push($(checkbox).val()));

            return value;
        }
    }

    reset(items: T[], idSelector: (item: T) => string, nameSelector: (item: T) => string): void {
        // Zuerst merken wir uns mal die aktuelle Einstellung
        var previousValue = this.value();

        // Dann wird die Oberfläche zurück gesetzt
        this.container.empty();

        // Und ganz neu aufgebaut
        $.each(items, (index, item) => {
            var id = "mve" + (++MultiValueEditor.idCounter);

            var checkbox = $('<input />', { type: 'checkbox', id: id, value: idSelector(item) }).appendTo(this.container).click(() => this.onChange());
            var label = $('<label />', { 'for': id, text: nameSelector(item) }).appendTo(this.container);
        });

        // Alle Werte, die wir ausgewählt haben, werden wieder aktiviert - sofern sie bekannt sind
        this.value(previousValue);
    }
}
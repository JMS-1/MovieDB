/// <reference path='typings/jquery/jquery.d.ts' />
/// <reference path='typings/jqueryui/jqueryui.d.ts' />
/// <reference path='interfaces.ts' />

class Styles {
    static invisble = 'invisible';

    static loading = 'stateLoading';

    static busy = 'stateBusy';

    static idle = 'stateIdle';

    static pageButton = 'pageButton';

    static activePageButton = 'pageButtonSelected';

    static disabledOption = 'disabledOption';
}

class GenreSelector {
    constructor(genre: IGenre, container: JQuery, onChange: () => void) {
        var id = 'genreCheckbox' + genre.id;

        this.checkbox = $('<input />', { type: 'checkbox', id: id, name: genre.id }).appendTo(container).change(onChange);
        this.label = $('<label />', { 'for': id, text: genre.description }).appendTo(container);
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

    initialize(genres: IGenre[], onChange: () => void): void {
        this.container.empty();
        this.genres = {};

        $.each(genres, (index, genre) => this.genres[genre.id] = new GenreSelector(genre, this.container, onChange));
    }

    setCount(statistics: IGenreStatistics[]): void {
        $.each(this.genres, (key, genre: GenreSelector) => genre.reset());
        $.each(statistics, (index, genre) => (<GenreSelector>this.genres[genre.id]).setCount(genre.count));
    }

    resetFilter(): void {
        this.foreachSelected(checkbox => checkbox.prop('checked', false));
    }

    foreachSelected(processor: (checkbox: JQuery) => void): void {
        this.container.children('input[type=checkbox]:checked').each((index, checkbox) => processor($(checkbox)));
    }
}

class OptionSelector {
    constructor(id: string, description: string, container: JQuery) {
        this.option = $(new Option(description, id)).appendTo(container);
        this.description = description;
    }

    private option: JQuery;

    private description: string;

    reset(): void {
        this.option.addClass(Styles.disabledOption);
        this.option.text(this.description + ' (0)');
    }

    setCount(count: number): void {
        this.option.text(this.description + ' (' + count + ')');
        this.option.removeClass(Styles.disabledOption);
    }
}

class OptionSelectors {
    private options: any = {};

    container: JQuery;

    constructor(containerSelector: string) {
        this.container = $(containerSelector);
    }

    preInitialize<U>(items: U[], idSelector: (item: U) => string, nameSelector: (item: U) => string): void {
        this.container.empty();
        this.options = {};

        this.container.append(new Option('(egal)', ''));

        $.each(items, (index, item) => this.options[item.id] = new OptionSelector(idSelector(item), nameSelector(item), this.container));
    }

    resetFilter(): void {
        this.container.val(null);
    }

    setCount(statistics: IStatistics[]): void {
        $.each(this.options, (key, item: OptionSelector) => item.reset());
        $.each(statistics, (index, item) => (<OptionSelector>this.options[item.id]).setCount(item.count));
    }
}

class LanguageSelectors extends OptionSelectors {
    initialize(languages: ILanguage[]): void {
        this.preInitialize(languages, language => language.id, language => language.description);
    }
}

class SeriesSelectors extends OptionSelectors {
    initialize(series: ISeriesMappingContract[]): void {
        this.preInitialize(series, mapping => mapping.id, mapping => mapping.hierarchicalName);
    }
}
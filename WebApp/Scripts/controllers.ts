
// Die Auswahl des Verleihers wird über drei separate Optionsfelder realisiert
class RentFilterController {
    private model = new RentFilterModel();

    constructor(private view: JQuery) {
        this.view
            .accordion(Styles.accordionSettings)
            .find('input')
            .button()
            .change(() => this.viewToModel());

        this.model.change(() => this.modelToView());

        this.modelToView();
    }

    private viewToModel() {
        var choice: string = this.view.find(':checked').val();
        if (choice.length < 1)
            this.model.val(null);
        else
            this.model.val(choice == '1');
    }

    private modelToView(): void {
        var val = this.model.val();
        var value = (val == null) ? '' : (val ? '1' : '0');

        this.view.find('input[value="' + value + '"]').prop('checked', true);
        this.view.find('input').button('refresh');

        if (val == null)
            this.view.find('.header').text('(egal)');
        else
            this.view.find('.header').text(val ? 'nur verliehene' : 'nur nicht verliehene');
    }
}

/// Die Auswahl der Sprache erfolgt durch eine Reihe von Alternativen
class LanguageFilterController {
    private model = new LanguageFilterModel();

    constructor(private view: JQuery) {
        this.view.accordion(Styles.accordionSettings);

        this.languageMap = new LanguageSelectors(view.find('.container'), () => this.viewToModel());

        this.model.change(() => this.modelToView());

        this.modelToView();
    }

    private languageMap: LanguageSelectors;

    private viewToModel() {
        this.model.val(this.languageMap.val());
    }

    private modelToView(): void {
        var val = this.model.val();

        this.languageMap.val(val);

        this.view.find('.header').text(this.languageMap.lookupLanguageName(val) || '(egal)');
    }

    initialize(languages: ILanguageContract[]): void {
        this.languageMap.initialize(languages);
    }

    setCounts(languages: ILanguageStatisticsContract[]): void {
        this.languageMap.setCounts(languages);
    }
}

// Bei den Kategorien ist im Filter eine Mehrfachauswahl möglich
class GenreFilterController {
    private model = new GenreFilterModel();

    constructor(private view: JQuery) {
        this.view.accordion(Styles.accordionSettings);

        this.genreMap = new GenreSelectors(view.find('.container'), () => this.viewToModel());

        this.model.change(() => this.modelToView());

        this.modelToView();
    }

    private genreMap: GenreSelectors;

    private viewToModel() {
        this.model.val(this.genreMap.val());
    }

    private modelToView(): void {
        var genres = this.model.val();

        this.genreMap.val(genres);

        if (genres.length < 1)
            this.view.find('.header').text('(egal)');
        else
            this.view.find('.header').text($.map(genres, genre => this.genreMap.lookupGenreName(genre)).join(' und '));
    }

    initialize(genres: IGenreContract[]): void {
        this.genreMap.initialize(genres);
    }

    setCounts(genres: IGenreStatisticsContract[]): void {
        this.genreMap.setCounts(genres);
    }
}
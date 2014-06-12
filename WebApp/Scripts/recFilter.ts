/// <reference path='typings/jquery/jquery.d.ts' />
/// <reference path='typings/jqueryui/jqueryui.d.ts' />
/// <reference path='interfaces.ts' />
/// <reference path='uiHelper.ts' />

// Erweiterte Informationen zu einer Aufzeichnung in der Tabellenansicht
interface IRecordingInfo extends IRecordingRowContract {
    // Das Datum als JavaScript Objekt
    created: Date;

    // Der rekonstruierte volle Namen
    hierarchicalName: string;
}

// Erweiterte Informationen zum Ergebnis einer Suche
interface ISearchInformation extends ISearchInformationContract {
    // Alle Aufzeichnungen im aktuellen Suchergebnis, allerdings in der erweiterten Darstellung
    recordings: IRecordingInfo[];
}

// Erweiterte Informationen zu einer Serie
interface ISeriesMapping extends ISeriesMappingContract {
    // Alle untergeordneten Serien
    children: ISeriesMapping[];
}

// Die Verwaltung der Suche nach Aufzeichnungen
class RecordingFilter extends SearchRequestContract {
    constructor(resultProcessor: (result: ISearchInformation) => void, getSeries: (series: string) => ISeriesMapping) {
        super();

        this.callback = resultProcessor;
        this.seriesLookup = getSeries;

        this.prepareText();
        this.prepareRent();
        this.prepareGenre();
        this.prepareSeries();
        this.prepareLanguage();
    }

    // Hiermit stellen wir sicher, dass ein nervös klickender Anwender immer nur das letzte Suchergebnis bekommt
    private pending: number = 0;

    // Wird aufgerufen, sobald ein Suchergebnis bereit steht
    private callback: (result: ISearchInformation) => void;

    // Wird verwendet, um zur eindeutigen Kennung einer Serie die erweiterten Serieninformationen zu ermitteln
    private seriesLookup: (series: string) => ISeriesMapping;

    private languageMap: LanguageSelectors;

    private genreMap: GenreSelectors;

    private seriesMap: SeriesSelectors;

    // Stellt sicher, dass bei der Serialisierung keine internen Strukturen übertragen werden
    private static propertyFilter(propertyName: string, propertyValue: any): any {
        if (propertyName != 'pending')
            if (propertyName != 'callback')
                if (propertyName != 'seriesLookup')
                    if (propertyName != 'languageMap')
                        if (propertyName != 'genreMap')
                            if (propertyName != 'seriesMap')
                                return propertyValue;

        return undefined;
    }

    // Setzt die Suchbedingung und die zugehörigen Oberflächenelemente auf den Grundzustand zurück und fordert ein neues Suchergebnis an
    reset(): void {
        this.language = null;
        this.languageMap.resetFilter();

        this.series = [];
        this.seriesMap.resetFilter();

        this.genres = [];
        this.genreMap.resetFilter();
        this.onGenreChanged(false);

        this.rent = null;
        $('#anyRent').prop('checked', true);
        $('#rentFilter').buttonset('refresh');

        this.text = null;
        $('#textSearch').val(null);

        this.page = 0;
        this.query();
    }

    // Führt eine Suche mit der aktuellen Einschränkung aus
    query(): void {
        // Anzeige auf der Oberfläche herrichten
        var busyIndicator = $('#busyIndicator');
        busyIndicator.removeClass(Styles.idle);
        busyIndicator.addClass(Styles.busy);

        // Jede Suche bekommt eine neue Nummer und es wird immer nur das letzte Ergebnis ausgewertet
        var thisRequest = ++this.pending;

        $.ajax('movie/db', {
            contentType: 'application/json; charset=utf-8',
            data: JSON.stringify(this, RecordingFilter.propertyFilter),
            dataType: 'json',
            type: 'POST',
        }).done((searchResult: ISearchInformation) => {
                // Veraltete Ergebnisse überspringen wir einfach
                if (this.pending != thisRequest)
                    return;

                // Anzeige auf der Oberfläche herrichten
                var busyIndicator = $('#busyIndicator');
                busyIndicator.removeClass(Styles.busy);
                busyIndicator.addClass(Styles.idle);

                // Das war leider nichts
                if (searchResult == null)
                    return;
                var recordings = searchResult.recordings;
                if (recordings == null)
                    return;

                // Ein wenig Vorarbeit hübscht die Daten vom Web Service etwas auf: aus der Rohdarstellung des Datums machen wir ein Date Objekt
                $.each(recordings, (index, recording) => recording.created = new Date(recording.createdAsString));

                // Und verarbeiten
                this.callback(searchResult);
            });
    }

    private onTextChanged(): void {
        this.text = $('#textSearch').val();
        this.page = 0;
    }

    private prepareText(): void {
        var textSearch = $('#textSearch');

        textSearch.on('change', () => this.onTextChanged());
        textSearch.on('input', () => this.onTextChanged());
        textSearch.on('keypress', (e: JQueryEventObject): void => {
            if (e.which == 13)
                this.query();
        });
    }

    private onRentChanged(): void {
        var rentChooser = $('#rentFilter');
        var choice: string = rentChooser.find(':checked').val();
        var newRent: boolean = null;

        if (choice.length > 0)
            newRent = (choice == '1');
        if (this.rent == newRent)
            return;

        this.rent = newRent;
        this.page = 0;

        this.query();
    }

    private prepareRent(): void {
        $('#rentFilter').buttonset().click(() => this.onRentChanged());
    }

    setLanguages(languages: ILanguageContract[]): void {
        this.language = null;
        this.page = 0;

        this.languageMap.initialize(languages);
    }

    setLanguageCounts(languages: ILanguageStatisticsContract[]): void {
        this.languageMap.setCounts(languages);
    }

    private onLanguageChanged(): void {
        this.language = this.languageMap.container.find(':checked').val();
        this.page = 0;

        this.query();
    }

    private prepareLanguage(): void {
        this.languageMap = new LanguageSelectors('#languageFilter');

        this.languageMap.container.click(() => this.onLanguageChanged());
    }

    setGenres(genres: IGenreContract[]): void {
        this.genreMap.initialize(genres, () => this.onGenreChanged(true));
        this.onGenreChanged(false);
    }

    setGenreCounts(genres: IGenreStatisticsContract[]): void {
        this.genreMap.setCounts(genres);
    }

    private onGenreChanged(query: boolean): void {
        this.genres = [];
        this.page = 0;

        this.genreMap.foreachSelected(checkbox => this.genres.push(checkbox.attr('name')));

        var genreFilterHeader = $('#genreFilterHeader');
        if (this.genres.length < 1)
            genreFilterHeader.text('(egal)');
        else
            genreFilterHeader.text(this.genres.join(' und '));

        if (query)
            this.query();
    }

    private prepareGenre(): void {
        this.genreMap = new GenreSelectors('#genreFilter');
    }

    // Fügt eine Serie und alle untergeordneten Serien zur Suche hinzu
    private applySeriesToFilterRecursive(series: ISeriesMapping): void {
        this.series.push(series.id);

        $.each(series.children, (index, child) => this.applySeriesToFilterRecursive(child));
    }

    // Wird aufgerufen, sobald der die Serie verändert hat
    private onSeriesChanged(): void {
        this.series = [];
        this.page = 0;

        // In dieser Oberfläche bedeutet die Auswahl einer Serie automatisch auch, dass alle untergeordneten Serien mit berücksichtigt werden sollen
        var series: string = this.seriesMap.container.val();
        if (series.length > 0)
            this.applySeriesToFilterRecursive(this.seriesLookup(series));

        this.query();
    }

    // Verbindet mit dem Oberflächenelement zur Auswahl der Serie
    private prepareSeries(): void {
        this.seriesMap = new SeriesSelectors('#seriesFilter');

        this.seriesMap.container.change(() => this.onSeriesChanged());
    }

    // Meldet alle bekannten Serien
    setSeries(series: ISeriesMappingContract[]): void {
        this.series = [];
        this.page = 0;

        this.seriesMap.initialize(series);
    }
} 
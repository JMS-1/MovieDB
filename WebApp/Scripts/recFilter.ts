/// <reference path='typings/jquery/jquery.d.ts' />
/// <reference path='typings/jqueryui/jqueryui.d.ts' />
/// <reference path='interfaces.ts' />

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
    constructor(resultProcessor: (result: ISearchInformation) => void, getSeries: (series: string) => ISeriesMapping, getLanguageName: (identifier: string) => string) {
        super();

        this.languageLookup = getLanguageName;
        this.callback = resultProcessor;
        this.seriesLookup = getSeries;

        this.prepareText();
        this.prepareRent();
        this.prepareGenre();
        this.prepareSeries();
        this.prepareLanguage();

        this.reset(false);
    }

    // Hiermit stellen wir sicher, dass ein nervös klickender Anwender immer nur das letzte Suchergebnis bekommt
    private pending: number = 0;

    // Wird aufgerufen, sobald ein Suchergebnis bereit steht
    private callback: (result: ISearchInformation) => void;

    // Wird verwendet, um zur eindeutigen Kennung einer Serie die erweiterten Serieninformationen zu ermitteln
    private seriesLookup: (series: string) => ISeriesMapping;

    // Ermittelt zur eindeutigen Kennung einer Sprache den Anzeigenamen
    private languageLookup: (identifier: string) => string

    // Gesetzt, wenn die automatische Suche nach der Eingabe eines Suchtextes aktiviert ist
    private timeout: number = null;

    // Die Auswahl der Sprachen
    private languageMap: LanguageSelectors;

    // Die Auswahl der Kategorien
    private genreMap: GenreSelectors;

    // Die Auswahl der Serien
    private seriesMap: SeriesTreeSelector;

    // Stellt sicher, dass bei der Serialisierung keine internen Strukturen übertragen werden
    private static propertyFilter(propertyName: string, propertyValue: any): any {
        if (propertyName != 'pending')
            if (propertyName != 'callback')
                if (propertyName != 'seriesLookup')
                    if (propertyName != 'languageLookup')
                        if (propertyName != 'languageMap')
                            if (propertyName != 'genreMap')
                                if (propertyName != 'seriesMap')
                                    if (propertyName != 'timeout')
                                        return propertyValue;

        return undefined;
    }

    // Setzt die Suchbedingung und die zugehörigen Oberflächenelemente auf den Grundzustand zurück und fordert ein neues Suchergebnis an
    reset(query: boolean): void {
        this.language = null;
        this.languageMap.resetFilter();
        $('#languageFilterHeader').text(this.languageLookup(''));

        this.series = [];
        this.seriesMap.resetFilter();
        $('#seriesFilterHeader').text('(egal)');

        this.genres = [];
        this.genreMap.resetFilter();
        this.onGenreChanged(false);

        this.rent = null;
        $('#anyRent').prop('checked', true);
        $('#rentFilter').buttonset('refresh');

        this.text = null;
        $('#textSearch').val(null);

        this.page = 0;

        if (query)
            this.query();
    }

    // Asynchrone automatische Suche deaktivieren
    private stopAutoQuery(): void {
        if (this.timeout != null)
            window.clearTimeout(this.timeout);

        this.timeout = null;
    }

    // Automatisch Suche nach der Änderung der Texteingabe
    private onAutoQuery(): void {
        var newText = $('#textSearch').val();
        if (this.text == newText)
            return;

        this.text = newText;
        this.page = 0;
        this.query();
    }

    // Führt eine Suche mit der aktuellen Einschränkung aus
    query(): void {
        this.stopAutoQuery();

        // Anzeige auf der Oberfläche herrichten
        var busyIndicator = $('#busyIndicator');
        busyIndicator.removeClass(Styles.idle);
        busyIndicator.addClass(Styles.busy);

        // Jede Suche bekommt eine neue Nummer und es wird immer nur das letzte Ergebnis ausgewertet
        var thisRequest = ++this.pending;

        $.ajax('movie/db/query', {
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

    // Jeder Tastendruck führt verzögert zu einer neuen Suche
    private onTextChanged(): void {
        this.stopAutoQuery();
        this.timeout = window.setTimeout(() => this.onAutoQuery(), 300);
    }

    // Verbindet die Oberflächenelemente der Freitextsuche
    private prepareText(): void {
        $('#textSearch').on('change', () => this.onTextChanged());
        $('#textSearch').on('input', () => this.onTextChanged());
        $('#textSearch').on('keypress', () => this.onTextChanged());
    }

    // Die Auswahl des Ausleihers wurde verändert
    private onRentChanged(): void {
        // Es ist immer nur eine Auswahl aktiv
        var choice: string = $('#rentFilter').find(':checked').val();

        // Und uns interessieren nur Änderungen
        var newRent: boolean = null;
        if (choice.length > 0)
            newRent = (choice == '1');
        if (this.rent == newRent)
            return;

        // Suche aktualisieren
        this.rent = newRent;
        this.page = 0;
        this.query();
    }

    // Bereitet die Auswahl des Ausleihers vor
    private prepareRent(): void {
        $('#rentFilter').buttonset().change(() => this.onRentChanged());
    }

    // Legt die bekannten Sprachen fest
    setLanguages(languages: ILanguageContract[]): void {
        this.language = null;
        this.page = 0;

        this.languageMap.initialize(languages);
    }

    // Setzt die Anzahl von Aufzeichnungen pro Sprache gemäß der aktuelle Suchbedingung
    setLanguageCounts(languages: ILanguageStatisticsContract[]): void {
        this.languageMap.setCounts(languages);
    }

    // Die Auswahl der Sprache wurde verändert
    private onLanguageChanged(): void {
        // Wir reagieren nur auf Veränderungen
        var newLanguage = this.languageMap.container.find(':checked').val();
        if (this.language == newLanguage)
            return;

        $('#languageFilterHeader').text(this.languageLookup(newLanguage));

        // Suche aktualisieren
        this.language = newLanguage;
        this.page = 0;
        this.query();
    }

    // Verbindet die Oberflächenelemente zur Auswahl der Sprache
    private prepareLanguage(): void {
        this.languageMap = new LanguageSelectors('#languageFilter');
        this.languageMap.container.change(() => this.onLanguageChanged());
    }

    // Meldet alle bekannten Arten von Aufzeichnungen
    setGenres(genres: IGenreContract[]): void {
        this.genreMap.initialize(genres, () => this.onGenreChanged(true));
        this.onGenreChanged(false);
    }

    // Meldet die Anzahl der Aufzeichnungen pro 
    setGenreCounts(genres: IGenreStatisticsContract[]): void {
        this.genreMap.setCounts(genres);
    }

    // Die Auswahl der Art von Aufzeichnung wurde verändert
    private onGenreChanged(query: boolean): void {
        var selected: string[] = [];

        this.genres = [];
        this.page = 0;

        // Erst einmal sammeln wir alle Arten, die angewählt sind
        this.genreMap.foreachSelected(checkbox => {
            this.genres.push(checkbox.attr('name'));

            selected.push(checkbox.attr('data-text'));
        });

        // Dann machen wir daraus einen Gesamttext als schnelle Übersicht für den Anwender
        var genreFilterHeader = $('#genreFilterHeader');
        if (this.genres.length < 1)
            genreFilterHeader.text('(egal)');
        else
            genreFilterHeader.text(selected.join(' und '));

        if (query)
            this.query();
    }

    // Verbindet die Oberflächenelemente zur Auswahl der Art von Aufzeichnung
    private prepareGenre(): void {
        this.genreMap = new GenreSelectors('#genreFilter');
    }

    // Fügt eine Serie und alle untergeordneten Serien zur Suche hinzu
    private applySeriesToFilterRecursive(series: ISeriesMapping): void {
        this.series.push(series.id);

        $.each(series.children, (index, child) => this.applySeriesToFilterRecursive(child));
    }

    // Wird aufgerufen, sobald der die Serie verändert hat
    private onSeriesChanged(series: string, name: string): void {
        $('#seriesFilterHeader').text(name || '(egal)');

        this.series = [];
        this.page = 0;

        // In dieser Oberfläche bedeutet die Auswahl einer Serie automatisch auch, dass alle untergeordneten Serien mit berücksichtigt werden sollen
        if (series != null)
            this.applySeriesToFilterRecursive(this.seriesLookup(series));

        this.query();
    }

    // Verbindet mit dem Oberflächenelement zur Auswahl der Serie
    private prepareSeries(): void {
        this.seriesMap = new SeriesTreeSelector('#seriesFilter', (series, name) => this.onSeriesChanged(series, name));

        $().accordion
        $('#seriesFilterAccordion').on('accordionactivate', (event, ui) => this.seriesMap.toggled(event, ui));
    }

    // Meldet alle bekannten Serien
    setSeries(series: ISeriesMapping[]): void {
        this.series = [];
        this.page = 0;

        this.seriesMap.initialize(series);
    }
} 
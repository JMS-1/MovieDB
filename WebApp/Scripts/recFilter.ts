
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
class RecordingFilter {
    constructor(resultProcessor: (result: ISearchInformation) => void, getSeries: (series: string) => ISeriesMapping) {
        this.callback = resultProcessor;
        this.seriesLookup = getSeries;

        this.page.change(() => this.query(false));

        var newRequest = () => this.query(true);

        this.languageController.model.change(newRequest);
        this.seriesController.model.change(newRequest);
        this.genreController.model.change(newRequest);
        this.rentController.model.change(newRequest);
        this.size.change(newRequest);

        this.textController.elapsed = newRequest;
    }

    // Verwaltet die Auswahl für den Verleiher
    private rentController = new RentFilterController($('.rentFilter'));

    // Die Auswahl der Serien
    private seriesController = new SeriesFilterController($('.seriesFilter'));

    // Verwaltet die Auswahl der Sprache
    private languageController = new LanguageFilterController($('.languageFilter'));

    // Verwaltet die Auswahl der Kategorien
    private genreController = new GenreFilterController($('.genreFilter'));

    // Verwaltet die Eingabe der Freitextsuche
    private textController = new TextFilterController($('#textSearch'));

    // Hiermit stellen wir sicher, dass ein nervös klickender Anwender immer nur das letzte Suchergebnis bekommt
    private pending: number = 0;

    // Wird aufgerufen, sobald ein Suchergebnis bereit steht
    private callback: (result: ISearchInformation) => void;

    // Wird verwendet, um zur eindeutigen Kennung einer Serie die erweiterten Serieninformationen zu ermitteln
    private seriesLookup: (series: string) => ISeriesMapping;

    // Gesetzt, wenn keine automatische Suche ausgelöst werden soll
    private disallowQuery: boolean = false;

    // Die Anzahl der Ergebnisse pro Seite
    size = new Model<number>(15);

    // Die aktuelle Seite
    page = new Model<number>(0);

    // Die Spalte, nach der sortiert werden soll
    order = new Model<string>(OrderSelector.title);

    // Die Sortierordnung
    ascending = new Model<boolean>(true);

    // Setzt die Suchbedingung und die zugehörigen Oberflächenelemente auf den Grundzustand zurück und fordert ein neues Suchergebnis an
    reset(query: boolean): void {
        this.disallowQuery = true;
        try {
            this.languageController.model.val(null);
            this.seriesController.model.val(null);
            this.textController.model.val(null);
            this.rentController.model.val(null);
            this.genreController.model.val([]);
            this.page.val(0);
        }
        finally {
            this.disallowQuery = false;
        }

        if (query)
            this.query();
    }

    // Führt eine Suche mit der aktuellen Einschränkung aus
    query(resetPage: boolean = false): void {
        if (resetPage) {
            this.disallowQuery = true;
            try {
                this.page.val(0);
            } finally {
                this.disallowQuery = false;
            }
        }

        if (this.disallowQuery)
            return;

        this.textController.stop();

        // Anzeige auf der Oberfläche herrichten
        var busyIndicator = $('#busyIndicator');
        busyIndicator.removeClass(Styles.idle);
        busyIndicator.addClass(Styles.busy);

        // Jede Suche bekommt eine neue Nummer und es wird immer nur das letzte Ergebnis ausgewertet
        var thisRequest = ++this.pending;

        // Suche zusammenstellen
        var request: ISearchRequestContract = {
            series: this.getSeries(this.seriesLookup(this.seriesController.model.val())),
            language: this.languageController.model.val(),
            genres: this.genreController.model.val(),
            rent: this.rentController.model.val(),
            text: this.textController.model.val(),
            ascending: this.ascending.val(),
            order: this.order.val(),
            size: this.size.val(),
            page: this.page.val(),
        };

        $.ajax('movie/db/query', {
            contentType: 'application/json; charset=utf-8',
            data: JSON.stringify(request),
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

    // Legt die bekannten Sprachen fest
    setLanguages(languages: ILanguageContract[]): void {
        this.languageController.initialize(languages);
    }

    // Setzt die Anzahl von Aufzeichnungen pro Sprache gemäß der aktuelle Suchbedingung
    setLanguageCounts(languages: ILanguageStatisticsContract[]): void {
        this.languageController.setCounts(languages);
    }

    // Meldet alle bekannten Arten von Aufzeichnungen
    setGenres(genres: IGenreContract[]): void {
        this.genreController.initialize(genres);
    }

    // Meldet die Anzahl der Aufzeichnungen pro 
    setGenreCounts(genres: IGenreStatisticsContract[]): void {
        this.genreController.setCounts(genres);
    }

    // Fügt eine Serie und alle untergeordneten Serien zur Suche hinzu
    private getSeries(series: ISeriesMapping, complete: string[]= []): string[] {
        if (series == null)
            return complete;

        complete.push(series.id);

        $.each(series.children, (index, child) => this.getSeries(child, complete));

        return complete;
    }

    // Meldet alle bekannten Serien
    setSeries(series: ISeriesMapping[]): void {
        this.seriesController.initialize(series);
    }
} 
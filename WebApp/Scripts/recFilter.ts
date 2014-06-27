
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
        this.prepareGenres();
        this.prepareSeries();
        this.prepareLanguage();

        this.reset(false);
    }

    // Verwaltet die Auswahl für den Verleiher
    private rentController = new RentFilterController($('.rentFilter'));

    // Die Auswahl der Serien
    private seriesController = new SeriesFilterController($('.seriesFilter'));

    // Verwaltet die Auswahl der Sprache
    private languageController = new LanguageFilterController($('.languageFilter'));

    // Verwaltet die Auswahl der Kategorien
    private genreController = new GenreFilterController($('.genreFilter'));

    // Hiermit stellen wir sicher, dass ein nervös klickender Anwender immer nur das letzte Suchergebnis bekommt
    private pending: number = 0;

    // Wird aufgerufen, sobald ein Suchergebnis bereit steht
    private callback: (result: ISearchInformation) => void;

    // Wird verwendet, um zur eindeutigen Kennung einer Serie die erweiterten Serieninformationen zu ermitteln
    private seriesLookup: (series: string) => ISeriesMapping;

    // Gesetzt, wenn die automatische Suche nach der Eingabe eines Suchtextes aktiviert ist
    private timeout: number = null;

    // Gesetzt, wenn keine automatische Suche ausgelöst werden soll
    private disallowQuery: boolean = false;

    // Setzt die Suchbedingung und die zugehörigen Oberflächenelemente auf den Grundzustand zurück und fordert ein neues Suchergebnis an
    reset(query: boolean): void {
        this.disallowQuery = true;
        try {
            this.languageController.model.val(null);
            this.seriesController.model.val(null);
            this.rentController.model.val(null);
            this.genreController.model.val([]);

            this.text = null;
            $('#textSearch').val(null);

            this.page = 0;
        }
        finally {
            this.disallowQuery = false;
        }

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
    query(resetPage: boolean = false): void {
        if (this.disallowQuery)
            return;

        if (resetPage)
            this.page = 0;

        this.stopAutoQuery();

        // Anzeige auf der Oberfläche herrichten
        var busyIndicator = $('#busyIndicator');
        busyIndicator.removeClass(Styles.idle);
        busyIndicator.addClass(Styles.busy);

        // Jede Suche bekommt eine neue Nummer und es wird immer nur das letzte Ergebnis ausgewertet
        var thisRequest = ++this.pending;

        // Suche zusammenstellen
        var request: SearchRequestContract = {
            language: this.languageController.model.val(),
            genres: this.genreController.model.val(),
            rent: this.rentController.model.val(),
            ascending: this.ascending,
            series: this.series,
            order: this.order,
            text: this.text,
            size: this.size,
            page: this.page,
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

    // Bereitet die Auswahl des Ausleihers vor
    private prepareRent(): void {
        this.rentController.model.change(() => this.query(true));
    }

    // Legt die bekannten Sprachen fest
    setLanguages(languages: ILanguageContract[]): void {
        this.languageController.initialize(languages);
    }

    // Setzt die Anzahl von Aufzeichnungen pro Sprache gemäß der aktuelle Suchbedingung
    setLanguageCounts(languages: ILanguageStatisticsContract[]): void {
        this.languageController.setCounts(languages);
    }

    // Verbindet die Oberflächenelemente zur Auswahl der Sprache
    private prepareLanguage(): void {
        this.languageController.model.change(() => this.query(true));
    }

    // Meldet alle bekannten Arten von Aufzeichnungen
    setGenres(genres: IGenreContract[]): void {
        this.genreController.initialize(genres);
    }

    // Meldet die Anzahl der Aufzeichnungen pro 
    setGenreCounts(genres: IGenreStatisticsContract[]): void {
        this.genreController.setCounts(genres);
    }

    // Verbindet die Oberflächenelemente zur Auswahl der Art von Aufzeichnung
    private prepareGenres(): void {
        this.genreController.model.change(() => this.query(true));
    }

    // Fügt eine Serie und alle untergeordneten Serien zur Suche hinzu
    private applySeriesToFilterRecursive(series: ISeriesMapping): void {
        this.series.push(series.id);

        $.each(series.children, (index, child) => this.applySeriesToFilterRecursive(child));
    }

    // Wird aufgerufen, sobald der die Serie verändert hat
    private onSeriesChanged(): void {
        var series = this.seriesController.model.val();

        this.series = [];
        this.page = 0;

        //        $('#seriesFilterHeader').text(name || '(egal)');


        // In dieser Oberfläche bedeutet die Auswahl einer Serie automatisch auch, dass alle untergeordneten Serien mit berücksichtigt werden sollen
        if (series != null)
            this.applySeriesToFilterRecursive(this.seriesLookup(series));

        this.query();
    }

    // Verbindet mit dem Oberflächenelement zur Auswahl der Serie
    private prepareSeries(): void {        
        this.seriesController.model.change(() => this.onSeriesChanged());
    }

    // Meldet alle bekannten Serien
    setSeries(series: ISeriesMapping[]): void {
        this.series = [];
        this.page = 0;

        this.seriesController.initialize(series);
    }
} 
/// <reference path='typings/jquery/jquery.d.ts' />
/// <reference path='typings/jqueryui/jqueryui.d.ts' />
/// <reference path='interfaces.ts' />
var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};



// Die Verwaltung der Suche nach Aufzeichnungen
var RecordingFilter = (function (_super) {
    __extends(RecordingFilter, _super);
    function RecordingFilter(resultProcessor, getSeries) {
        _super.call(this);
        // Hiermit stellen wir sicher, dass ein nervös klickender Anwender immer nur das letzte Suchergebnis bekommt
        this.pending = 0;
        // Gesetzt, wenn die automatische Suche nach der Eingabe eines Suchtextes aktiviert ist
        this.timeout = null;

        this.callback = resultProcessor;
        this.seriesLookup = getSeries;

        this.prepareText();
        this.prepareRent();
        this.prepareGenre();
        this.prepareSeries();
        this.prepareLanguage();

        this.reset(false);
    }
    // Stellt sicher, dass bei der Serialisierung keine internen Strukturen übertragen werden
    RecordingFilter.propertyFilter = function (propertyName, propertyValue) {
        if (propertyName != 'pending')
            if (propertyName != 'callback')
                if (propertyName != 'seriesLookup')
                    if (propertyName != 'languageMap')
                        if (propertyName != 'genreMap')
                            if (propertyName != 'seriesMap')
                                if (propertyName != 'timeout')
                                    return propertyValue;

        return undefined;
    };

    // Setzt die Suchbedingung und die zugehörigen Oberflächenelemente auf den Grundzustand zurück und fordert ein neues Suchergebnis an
    RecordingFilter.prototype.reset = function (query) {
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

        if (query)
            this.query();
    };

    // Asynchrone automatische Suche deaktivieren
    RecordingFilter.prototype.stopAutoQuery = function () {
        if (this.timeout != null)
            window.clearTimeout(this.timeout);

        this.timeout = null;
    };

    // Automatisch Suche nach der Änderung der Texteingabe
    RecordingFilter.prototype.onAutoQuery = function () {
        var newText = $('#textSearch').val();
        if (this.text == newText)
            return;

        this.text = newText;
        this.page = 0;
        this.query();
    };

    // Führt eine Suche mit der aktuellen Einschränkung aus
    RecordingFilter.prototype.query = function () {
        var _this = this;
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
            type: 'POST'
        }).done(function (searchResult) {
            // Veraltete Ergebnisse überspringen wir einfach
            if (_this.pending != thisRequest)
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
            $.each(recordings, function (index, recording) {
                return recording.created = new Date(recording.createdAsString);
            });

            // Und verarbeiten
            _this.callback(searchResult);
        });
    };

    // Jeder Tastendruck führt verzögert zu einer neuen Suche
    RecordingFilter.prototype.onTextChanged = function () {
        var _this = this;
        this.stopAutoQuery();
        this.timeout = window.setTimeout(function () {
            return _this.onAutoQuery();
        }, 300);
    };

    // Verbindet die Oberflächenelemente der Freitextsuche
    RecordingFilter.prototype.prepareText = function () {
        var _this = this;
        $('#textSearch').on('change', function () {
            return _this.onTextChanged();
        });
        $('#textSearch').on('input', function () {
            return _this.onTextChanged();
        });
        $('#textSearch').on('keypress', function () {
            return _this.onTextChanged();
        });
    };

    // Die Auswahl des Ausleihers wurde verändert
    RecordingFilter.prototype.onRentChanged = function () {
        // Es ist immer nur eine Auswahl aktiv
        var choice = $('#rentFilter').find(':checked').val();

        // Und uns interessieren nur Änderungen
        var newRent = null;
        if (choice.length > 0)
            newRent = (choice == '1');
        if (this.rent == newRent)
            return;

        // Suche aktualisieren
        this.rent = newRent;
        this.page = 0;
        this.query();
    };

    // Bereitet die Auswahl des Ausleihers vor
    RecordingFilter.prototype.prepareRent = function () {
        var _this = this;
        $('#rentFilter').buttonset().change(function () {
            return _this.onRentChanged();
        });
    };

    // Legt die bekannten Sprachen fest
    RecordingFilter.prototype.setLanguages = function (languages) {
        this.language = null;
        this.page = 0;

        this.languageMap.initialize(languages);
    };

    // Setzt die Anzahl von Aufzeichnungen pro Sprache gemäß der aktuelle Suchbedingung
    RecordingFilter.prototype.setLanguageCounts = function (languages) {
        this.languageMap.setCounts(languages);
    };

    // Die Auswahl der Sprache wurde verändert
    RecordingFilter.prototype.onLanguageChanged = function () {
        // Wir reagieren nur auf Veränderungen
        var newLanguage = this.languageMap.container.find(':checked').val();
        if (this.language == newLanguage)
            return;

        // Suche aktualisieren
        this.language = newLanguage;
        this.page = 0;
        this.query();
    };

    // Verbindet die Oberflächenelemente zur Auswahl der Sprache
    RecordingFilter.prototype.prepareLanguage = function () {
        var _this = this;
        this.languageMap = new LanguageSelectors('#languageFilter');
        this.languageMap.container.change(function () {
            return _this.onLanguageChanged();
        });
    };

    // Meldet alle bekannten Arten von Aufzeichnungen
    RecordingFilter.prototype.setGenres = function (genres) {
        var _this = this;
        this.genreMap.initialize(genres, function () {
            return _this.onGenreChanged(true);
        });
        this.onGenreChanged(false);
    };

    // Meldet die Anzahl der Aufzeichnungen pro
    RecordingFilter.prototype.setGenreCounts = function (genres) {
        this.genreMap.setCounts(genres);
    };

    // Die Auswahl der Art von Aufzeichnung wurde verändert
    RecordingFilter.prototype.onGenreChanged = function (query) {
        var _this = this;
        var selected = [];

        this.genres = [];
        this.page = 0;

        // Erst einmal sammeln wir alle Arten, die angewählt sind
        this.genreMap.foreachSelected(function (checkbox) {
            _this.genres.push(checkbox.attr('name'));

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
    };

    // Verbindet die Oberflächenelemente zur Auswahl der Art von Aufzeichnung
    RecordingFilter.prototype.prepareGenre = function () {
        this.genreMap = new GenreSelectors('#genreFilter');
    };

    // Fügt eine Serie und alle untergeordneten Serien zur Suche hinzu
    RecordingFilter.prototype.applySeriesToFilterRecursive = function (series) {
        var _this = this;
        this.series.push(series.id);

        $.each(series.children, function (index, child) {
            return _this.applySeriesToFilterRecursive(child);
        });
    };

    // Wird aufgerufen, sobald der die Serie verändert hat
    RecordingFilter.prototype.onSeriesChanged = function () {
        this.series = [];
        this.page = 0;

        // In dieser Oberfläche bedeutet die Auswahl einer Serie automatisch auch, dass alle untergeordneten Serien mit berücksichtigt werden sollen
        var series = this.seriesMap.container.val();
        if (series.length > 0)
            this.applySeriesToFilterRecursive(this.seriesLookup(series));

        this.query();
    };

    // Verbindet mit dem Oberflächenelement zur Auswahl der Serie
    RecordingFilter.prototype.prepareSeries = function () {
        var _this = this;
        this.seriesMap = new SeriesSelectors('#seriesFilter');
        this.seriesMap.container.change(function () {
            return _this.onSeriesChanged();
        });
    };

    // Meldet alle bekannten Serien
    RecordingFilter.prototype.setSeries = function (series) {
        this.series = [];
        this.page = 0;

        this.seriesMap.initialize(series);
    };
    return RecordingFilter;
})(SearchRequestContract);
//# sourceMappingURL=recFilter.js.map

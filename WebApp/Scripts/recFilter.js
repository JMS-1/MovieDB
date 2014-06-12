/// <reference path='typings/jquery/jquery.d.ts' />
/// <reference path='typings/jqueryui/jqueryui.d.ts' />
/// <reference path='interfaces.ts' />
/// <reference path='uiHelper.ts' />
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

        this.callback = resultProcessor;
        this.seriesLookup = getSeries;

        this.prepareText();
        this.prepareRent();
        this.prepareGenre();
        this.prepareSeries();
        this.prepareLanguage();
    }
    // Stellt sicher, dass bei der Serialisierung keine internen Strukturen übertragen werden
    RecordingFilter.propertyFilter = function (propertyName, propertyValue) {
        if (propertyName != 'pending')
            if (propertyName != 'callback')
                if (propertyName != 'seriesLookup')
                    if (propertyName != 'languageMap')
                        if (propertyName != 'genreMap')
                            if (propertyName != 'seriesMap')
                                return propertyValue;

        return undefined;
    };

    // Setzt die Suchbedingung und die zugehörigen Oberflächenelemente auf den Grundzustand zurück und fordert ein neues Suchergebnis an
    RecordingFilter.prototype.reset = function () {
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
    };

    // Führt eine Suche mit der aktuellen Einschränkung aus
    RecordingFilter.prototype.query = function () {
        var _this = this;
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

    RecordingFilter.prototype.onTextChanged = function () {
        this.text = $('#textSearch').val();
        this.page = 0;
    };

    RecordingFilter.prototype.prepareText = function () {
        var _this = this;
        var textSearch = $('#textSearch');

        textSearch.on('change', function () {
            return _this.onTextChanged();
        });
        textSearch.on('input', function () {
            return _this.onTextChanged();
        });
        textSearch.on('keypress', function (e) {
            if (e.which == 13)
                _this.query();
        });
    };

    RecordingFilter.prototype.onRentChanged = function () {
        var rentChooser = $('#rentFilter');
        var choice = rentChooser.find(':checked').val();
        var newRent = null;

        if (choice.length > 0)
            newRent = (choice == '1');
        if (this.rent == newRent)
            return;

        this.rent = newRent;
        this.page = 0;

        this.query();
    };

    RecordingFilter.prototype.prepareRent = function () {
        var _this = this;
        $('#rentFilter').buttonset().click(function () {
            return _this.onRentChanged();
        });
    };

    RecordingFilter.prototype.setLanguages = function (languages) {
        this.language = null;
        this.page = 0;

        this.languageMap.initialize(languages);
    };

    RecordingFilter.prototype.setLanguageCounts = function (languages) {
        this.languageMap.setCounts(languages);
    };

    RecordingFilter.prototype.onLanguageChanged = function () {
        this.language = this.languageMap.container.find(':checked').val();
        this.page = 0;

        this.query();
    };

    RecordingFilter.prototype.prepareLanguage = function () {
        var _this = this;
        this.languageMap = new LanguageSelectors('#languageFilter');

        this.languageMap.container.click(function () {
            return _this.onLanguageChanged();
        });
    };

    RecordingFilter.prototype.setGenres = function (genres) {
        var _this = this;
        this.genreMap.initialize(genres, function () {
            return _this.onGenreChanged(true);
        });
        this.onGenreChanged(false);
    };

    RecordingFilter.prototype.setGenreCounts = function (genres) {
        this.genreMap.setCounts(genres);
    };

    RecordingFilter.prototype.onGenreChanged = function (query) {
        var _this = this;
        this.genres = [];
        this.page = 0;

        this.genreMap.foreachSelected(function (checkbox) {
            return _this.genres.push(checkbox.attr('name'));
        });

        var genreFilterHeader = $('#genreFilterHeader');
        if (this.genres.length < 1)
            genreFilterHeader.text('(egal)');
        else
            genreFilterHeader.text(this.genres.join(' und '));

        if (query)
            this.query();
    };

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

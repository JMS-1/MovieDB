


// Die Verwaltung der Suche nach Aufzeichnungen
var RecordingFilter = (function () {
    function RecordingFilter(resultProcessor, getSeries) {
        var _this = this;
        // Verwaltet die Auswahl für den Verleiher
        this.rentController = new RentFilterController($('.rentFilter'));
        // Die Auswahl der Serien
        this.seriesController = new SeriesFilterController($('.seriesFilter'));
        // Verwaltet die Auswahl der Sprache
        this.languageController = new LanguageFilterController($('.languageFilter'));
        // Verwaltet die Auswahl der Kategorien
        this.genreController = new GenreFilterController($('.genreFilter'));
        // Verwaltet die Eingabe der Freitextsuche
        this.textController = new TextFilterController($('#textSearch'));
        // Hiermit stellen wir sicher, dass ein nervös klickender Anwender immer nur das letzte Suchergebnis bekommt
        this.pending = 0;
        // Gesetzt, wenn keine automatische Suche ausgelöst werden soll
        this.disallowQuery = false;
        // Die Anzahl der Ergebnisse pro Seite
        this.size = new Model(15);
        // Die aktuelle Seite
        this.page = new Model(0);
        // Die Spalte, nach der sortiert werden soll
        this.order = new Model(OrderSelector.title);
        // Die Sortierordnung
        this.ascending = new Model(true);
        this.callback = resultProcessor;
        this.seriesLookup = getSeries;

        this.page.change(function () {
            return _this.query(false);
        });

        var newRequest = function () {
            return _this.query(true);
        };

        this.languageController.model.change(newRequest);
        this.seriesController.model.change(newRequest);
        this.genreController.model.change(newRequest);
        this.rentController.model.change(newRequest);
        this.size.change(newRequest);

        this.textController.elapsed = newRequest;
    }
    // Setzt die Suchbedingung und die zugehörigen Oberflächenelemente auf den Grundzustand zurück und fordert ein neues Suchergebnis an
    RecordingFilter.prototype.reset = function (query) {
        this.disallowQuery = true;
        try  {
            this.languageController.model.val(null);
            this.seriesController.model.val(null);
            this.textController.model.val(null);
            this.rentController.model.val(null);
            this.genreController.model.val([]);
            this.page.val(0);
        } finally {
            this.disallowQuery = false;
        }

        if (query)
            this.query();
    };

    // Führt eine Suche mit der aktuellen Einschränkung aus
    RecordingFilter.prototype.query = function (resetPage) {
        var _this = this;
        if (typeof resetPage === "undefined") { resetPage = false; }
        if (resetPage) {
            this.disallowQuery = true;
            try  {
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
        var request = {
            series: this.getSeries(this.seriesLookup(this.seriesController.model.val())),
            language: this.languageController.model.val(),
            genres: this.genreController.model.val(),
            rent: this.rentController.model.val(),
            text: this.textController.model.val(),
            ascending: this.ascending.val(),
            order: this.order.val(),
            size: this.size.val(),
            page: this.page.val()
        };

        $.ajax('movie/db/query', {
            contentType: 'application/json; charset=utf-8',
            data: JSON.stringify(request),
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

    // Legt die bekannten Sprachen fest
    RecordingFilter.prototype.setLanguages = function (languages) {
        this.languageController.initialize(languages);
    };

    // Setzt die Anzahl von Aufzeichnungen pro Sprache gemäß der aktuelle Suchbedingung
    RecordingFilter.prototype.setLanguageCounts = function (languages) {
        this.languageController.setCounts(languages);
    };

    // Meldet alle bekannten Arten von Aufzeichnungen
    RecordingFilter.prototype.setGenres = function (genres) {
        this.genreController.initialize(genres);
    };

    // Meldet die Anzahl der Aufzeichnungen pro
    RecordingFilter.prototype.setGenreCounts = function (genres) {
        this.genreController.setCounts(genres);
    };

    // Fügt eine Serie und alle untergeordneten Serien zur Suche hinzu
    RecordingFilter.prototype.getSeries = function (series, complete) {
        var _this = this;
        if (typeof complete === "undefined") { complete = []; }
        if (series == null)
            return complete;

        complete.push(series.id);

        $.each(series.children, function (index, child) {
            return _this.getSeries(child, complete);
        });

        return complete;
    };

    // Meldet alle bekannten Serien
    RecordingFilter.prototype.setSeries = function (series) {
        this.seriesController.initialize(series);
    };
    return RecordingFilter;
})();
//# sourceMappingURL=recFilter.js.map

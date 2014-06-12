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

var RecordingFilter = (function (_super) {
    __extends(RecordingFilter, _super);
    function RecordingFilter(resultProcessor) {
        _super.call(this);
        this.pending = 0;

        this.callback = resultProcessor;

        this.prepareText();
        this.prepareRent();
        this.prepareLanguage();
    }
    RecordingFilter.propertyFilter = function (propertyName, propertyValue) {
        if (propertyName != 'pending')
            if (propertyName != 'callback')
                return propertyValue;

        return undefined;
    };

    RecordingFilter.prototype.reset = function () {
        this.languageMap.resetFilter();

        var rentChooser = $('#rentFilter');
        rentChooser.find(':checked').prop('checked', false);
        $('#anyRent').prop('checked', true);
        rentChooser.buttonset('refresh');

        $('#textSearch').val(null);

        // Protokolldaten zurücksetzen
        this.language = null;
        this.series = [];
        this.genres = [];
        this.rent = null;
        this.text = null;
        this.page = 0;

        // Und aktualisieren
        this.query();
    };

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
            searchResult.ignore = (_this.pending != thisRequest);
            if (searchResult.ignore)
                return;

            // Anzeige auf der Oberfläche herrichten
            var busyIndicator = $('#busyIndicator');
            busyIndicator.removeClass(Styles.busy);
            busyIndicator.addClass(Styles.idle);

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
            if (_this.callback != null)
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
    return RecordingFilter;
})(SearchRequestContract);
//# sourceMappingURL=recFilter.js.map

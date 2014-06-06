/// <reference path='typings/jquery/jquery.d.ts' />
/// <reference path='typings/jqueryui/jqueryui.d.ts' />
var MovieDatabase;
(function (MovieDatabase) {
    var Styles = (function () {
        function Styles() {
        }
        Styles.invisble = 'invisible';
        return Styles;
    })();

    var DateTimeTools = (function () {
        function DateTimeTools() {
        }
        DateTimeTools.toNumber = function (val) {
            if (val < 10)
                return '0' + val.toString();
            else
                return val.toString();
        };

        DateTimeTools.toStandard = function (dateTime) {
            return DateTimeTools.toNumber(dateTime.getDate()) + '.' + DateTimeTools.toNumber(1 + dateTime.getMonth()) + '.' + dateTime.getFullYear().toString() + ' ' + DateTimeTools.toNumber(dateTime.getHours()) + ':' + DateTimeTools.toNumber(dateTime.getMinutes()) + ':' + DateTimeTools.toNumber(dateTime.getSeconds());
        };
        return DateTimeTools;
    })();

    

    

    

    

    

    

    // Die Eigenschaften, nach denen Aufzeichnungen sortiert werden können
    var OrderSelector = (function () {
        function OrderSelector() {
        }
        OrderSelector.title = 'titleWithSeries';

        OrderSelector.created = 'date';
        return OrderSelector;
    })();

    // Eine Suchanfrage
    var SearchRequest = (function () {
        function SearchRequest() {
            this.size = 15;
            this.page = 0;
            this.order = OrderSelector.title;
            this.ascending = true;
            this.genres = [];
            this.language = null;
            this.series = null;
            this.rent = false;
            this.text = null;
            this.pending = 0;
        }
        SearchRequest.prototype.send = function () {
            var _this = this;
            // Jede Suche bekommt eine neue Nummer und es wird immer nur das letzte Ergebnis ausgewertet
            var thisRequest = ++this.pending;

            return $.ajax('movie/db', {
                contentType: 'application/json; charset=utf-8',
                data: JSON.stringify(this),
                dataType: 'json',
                type: 'POST'
            }).done(function (searchResult) {
                // Veraltete Ergebnisse überspringen wir einfach
                searchResult.ignore = (_this.pending != thisRequest);
                if (searchResult.ignore)
                    return;

                if (searchResult == null)
                    return;

                var recordings = searchResult.recordings;
                if (recordings == null)
                    return;

                // Ein wenig Vorarbeit hübscht die Daten vom Web Service etwas auf: aus der Rohdarstellung des Datums machen wir ein Date Objekt
                $.each(recordings, function (index, recording) {
                    return recording.created = new Date(recording.createdAsString);
                });
            });
        };

        SearchRequest.Current = new SearchRequest();
        return SearchRequest;
    })();

    

    
    ;

    // Repräsentiert die Anwendung als Ganzes
    var Application = (function () {
        function Application() {
            var _this = this;
            $(function () {
                return _this.startup();
            });
        }
        Application.prototype.migrate = function () {
            var _this = this;
            var fileInput = (this.legacyFile[0]);
            if (fileInput.files.length != 1)
                return;

            var data = new FormData();
            data.append('legacyFile', fileInput.files[0]);

            var request = {
                contentType: false,
                processData: false,
                type: 'POST',
                data: data
            };

            $.ajax('movie/db/initialize', request).done(function () {
                return _this.refresh();
            });
        };

        Application.prototype.refresh = function () {
            var _this = this;
            this.requestApplicationInformation().done(function (info) {
                return _this.fillApplicationInformation(info);
            });
        };

        Application.prototype.query = function () {
            var _this = this;
            SearchRequest.Current.send().done(function (results) {
                if (!results.ignore)
                    _this.fillResultTable(results);
            });
        };

        Application.prototype.setLanguages = function () {
            var _this = this;
            SearchRequest.Current.language = null;

            this.languageFilter.empty();
            this.languageFilter.append(new Option('(egal)', '', true, true));

            $.each(this.currentApplicationInformation.languages, function (index, language) {
                _this.languageFilter.append(new Option(language.id, language.description));
            });
        };

        Application.prototype.fillApplicationInformation = function (info) {
            var _this = this;
            this.currentApplicationInformation = info;

            if (info.empty)
                this.migrateButton.removeClass(Styles.invisble);
            else
                this.migrateButton.addClass(Styles.invisble);

            $('#countInfo').text('(Es gibt ' + info.total + ' Aufzeichnung' + ((info.total == 1) ? '' : 'en') + ')');

            this.seriesMap = {};

            $.each(info.series, function (index, mapping) {
                mapping.children = [];

                _this.seriesMap[mapping.id] = mapping;
            });

            $.each(info.series, function (index, mapping) {
                if (mapping.parentId == null)
                    return;

                var parent = _this.seriesMap[mapping.parentId];

                parent.children.push(mapping);
            });

            this.setLanguages();

            this.query();
        };

        /*
        Hier werden die Rohdaten einer Suche nach Aufzeichnungen erst einmal angereichert
        und dann als Tabellenzeilen in die Oberfläche übernommen.
        */
        Application.prototype.fillResultTable = function (results) {
            var _this = this;
            var tableBody = $('#recordingTable>tbody');

            tableBody.empty();

            $.each(results.recordings, function (index, recording) {
                if (recording.series == null)
                    recording.hierarchicalName = recording.title;
                else {
                    var series = _this.seriesMap[recording.series];

                    recording.hierarchicalName = series.hierarchicalName + ' ' + _this.currentApplicationInformation.seriesSeparator + ' ' + recording.title;
                }

                var recordingRow = $('<tr></tr>').appendTo(tableBody);

                $('<td />').appendTo(recordingRow).text(recording.hierarchicalName);
                $('<td />').appendTo(recordingRow).text(recording.languages.join('; '));
                $('<td />').appendTo(recordingRow).text(recording.genres.join('; '));
                $('<td />').appendTo(recordingRow).text(DateTimeTools.toStandard(recording.created));
                $('<td />').appendTo(recordingRow).text(recording.rent);
            });

            this.setQueryMode();
        };

        Application.prototype.requestApplicationInformation = function () {
            return $.ajax('movie/info');
        };

        Application.prototype.resetAllModes = function () {
            $('.operationMode').addClass(Styles.invisble);
        };

        Application.prototype.setQueryMode = function () {
            this.resetAllModes();

            $('#queryMode').removeClass(Styles.invisble);
        };

        Application.prototype.startup = function () {
            var _this = this;
            // Migration vorbereiten
            this.legacyFile = $('#theFile');
            this.legacyFile.change(function () {
                return _this.migrate();
            });

            this.migrateButton = $('#migrate');
            this.migrateButton.button().click(function () {
                return _this.legacyFile.click();
            });

            this.languageFilter = $('#languageFilter');
            this.languageFilter.change(function () {
                SearchRequest.Current.language = _this.languageFilter.val();
                SearchRequest.Current.page = 0;

                _this.query();
            });

            // Allgemeine Informationen zur Anwendung abrufen - eventuell dauert das etwas, da die Datenbank gestartet werden muss
            this.requestApplicationInformation().done(function (info) {
                $('#headline').text('VCR.NET Mediendatenbank');

                _this.fillApplicationInformation(info);

                // Ab jetzt sind wir bereit
                $('#main').removeClass(Styles.invisble);
            });
        };
        Application.Current = new Application();
        return Application;
    })();
})(MovieDatabase || (MovieDatabase = {}));
//# sourceMappingURL=appCode.js.map

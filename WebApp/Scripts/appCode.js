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
        }
        SearchRequest.prototype.send = function () {
            return $.ajax('movie/db', {
                contentType: "application/json; charset=utf-8",
                data: JSON.stringify(this),
                dataType: "json",
                type: "POST"
            }).done(function (searchResult) {
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
                return _this.fillResultTable(results);
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

            this.query();
        };

        Application.prototype.fillResultTable = function (results) {
            var _this = this;
            $.each(results.recordings, function (index, recording) {
                if (recording.series == null)
                    return;

                var series = _this.seriesMap[recording.series];

                recording.hierarchicalName = series.hierarchicalName + ' ' + results.seriesSeparator + ' ' + recording.title;
            });
        };

        Application.prototype.requestApplicationInformation = function () {
            return $.ajax('movie/info');
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

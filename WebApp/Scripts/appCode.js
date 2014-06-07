﻿/// <reference path='typings/jquery/jquery.d.ts' />
/// <reference path='typings/jqueryui/jqueryui.d.ts' />
var MovieDatabase;
(function (MovieDatabase) {
    var Styles = (function () {
        function Styles() {
        }
        Styles.invisble = 'invisible';

        Styles.loading = 'stateLoading';

        Styles.busy = 'stateBusy';

        Styles.idle = 'stateIdle';

        Styles.pageButton = 'pageButton';

        Styles.activePageButton = 'pageButtonSelected';
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
            this.rent = null;
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
            this.busyIndicator.removeClass(Styles.idle);
            this.busyIndicator.addClass(Styles.busy);

            SearchRequest.Current.send().done(function (results) {
                if (!results.ignore)
                    _this.fillResultTable(results);
            });
        };

        Application.prototype.setLanguages = function () {
            var _this = this;
            SearchRequest.Current.language = null;
            SearchRequest.Current.page = 0;

            this.languageFilter.empty();
            this.languageFilter.append(new Option('(egal)', '', true, true));

            $.each(this.currentApplicationInformation.languages, function (index, language) {
                _this.languageFilter.append(new Option(language.id, language.description));
            });
        };

        Application.prototype.setGenres = function () {
            var _this = this;
            this.genreFilter.empty();

            $.each(this.currentApplicationInformation.genres, function (index, genre) {
                var capturedGenre = genre;
                var id = 'genreCheckbox' + capturedGenre.id;

                $('<input />', { type: 'checkbox', id: id, name: capturedGenre.id }).appendTo(_this.genreFilter).change(function () {
                    return _this.genreChanged(true);
                });
                $('<label />', { 'for': id, text: capturedGenre.description }).appendTo(_this.genreFilter);
            });

            this.genreChanged(false);
        };

        Application.prototype.selectedGenres = function (processor) {
            this.genreFilter.children('input[type=checkbox]:checked').each(function (index, checkbox) {
                return processor($(checkbox));
            });
        };

        Application.prototype.genreChanged = function (query) {
            SearchRequest.Current.genres = [];
            SearchRequest.Current.page = 0;

            this.selectedGenres(function (checkbox) {
                return SearchRequest.Current.genres.push(checkbox.attr('name'));
            });

            if (SearchRequest.Current.genres.length < 1)
                this.genreFilterHeader.text('(egal)');
            else
                this.genreFilterHeader.text(SearchRequest.Current.genres.join(' und '));

            if (query)
                this.query();
        };

        Application.prototype.fillApplicationInformation = function (info) {
            var _this = this;
            this.busyIndicator.removeClass(Styles.loading);
            this.busyIndicator.addClass(Styles.idle);

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

            this.setGenres();
            this.setLanguages();

            this.query();
        };

        /*
        Hier werden die Rohdaten einer Suche nach Aufzeichnungen erst einmal angereichert
        und dann als Tabellenzeilen in die Oberfläche übernommen.
        */
        Application.prototype.fillResultTable = function (results) {
            var _this = this;
            this.busyIndicator.removeClass(Styles.busy);
            this.busyIndicator.addClass(Styles.idle);

            if (results.total < results.size) {
                this.pageSizeCount.text('');

                this.pageButtons.addClass(Styles.invisble);
            } else {
                this.pageSizeCount.text(' von ' + results.total);

                this.pageButtons.removeClass(Styles.invisble);
                this.pageButtons.empty();

                var pagesShown = 20;
                var numberOfPages = Math.floor((results.total + results.size - 1) / results.size);
                var firstIndex = Math.max(0, results.page - 2);
                var lastIndex = Math.min(numberOfPages - 1, firstIndex + pagesShown - 1);

                for (var index = firstIndex; index <= lastIndex; index++)
                    (function (capturedIndex) {
                        var anchor = $('<a href="javascript:void(0)" class="' + Styles.pageButton + '" />').appendTo(_this.pageButtons).button();

                        if (capturedIndex == results.page)
                            anchor.addClass(Styles.activePageButton);

                        // Das wäre der Normalfall
                        anchor.text(1 + capturedIndex);

                        // Das normale Layout der List ist: <Erste Seite> <Ein Block zurück> <Aktuelle Seite> <nächste Seite> ... <Ein Block vorwärts> <Letzte Seite>
                        if (capturedIndex == results.page - 2) {
                            if (capturedIndex > 0) {
                                anchor.text('<<');

                                capturedIndex = 0;
                            }
                        } else if (capturedIndex == results.page - 1) {
                            if (results.page > pagesShown - 4) {
                                anchor.text('<');

                                capturedIndex = results.page - (pagesShown - 4);
                            }
                        } else if (capturedIndex == firstIndex + pagesShown - 2) {
                            if (capturedIndex < numberOfPages - 2)
                                anchor.text('>');
                        } else if (capturedIndex == firstIndex + pagesShown - 1) {
                            if (capturedIndex < numberOfPages - 1) {
                                anchor.text('>>');

                                capturedIndex = numberOfPages - 1;
                            }
                        }

                        // Geben wir noch einen Tooltip dazu
                        anchor.attr('title', 'Seite ' + (1 + capturedIndex));

                        // Der Link wird nur aktiv, wenn er zu einer anderen Seite führt
                        if (capturedIndex == results.page)
                            anchor.removeAttr('href');
                        else
                            anchor.click(function () {
                                SearchRequest.Current.page = capturedIndex;

                                _this.query();
                            });
                    })(index);
            }

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

        Application.prototype.textChanged = function () {
            SearchRequest.Current.text = this.textSearch.val();
            SearchRequest.Current.page = 0;
        };

        Application.prototype.startup = function () {
            var _this = this;
            this.busyIndicator = $('#busyIndicator');

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

            this.genreFilter = $('#genreFilter');
            this.genreFilterHeader = $('#genreFilterHeader');

            this.pageSize = $('#pageSize');
            this.pageSizeCount = $('#pageSizeCount');
            this.pageSize.change(function () {
                SearchRequest.Current.size = parseInt(_this.pageSize.val());
                SearchRequest.Current.page = 0;

                _this.query();
            });

            this.textSearch = $('#textSearch');
            this.textSearch.on('change', function () {
                return _this.textChanged();
            });
            this.textSearch.on('input', function () {
                return _this.textChanged();
            });
            this.textSearch.on('keypress', function (e) {
                if (e.which == 13)
                    _this.query();
            });

            this.pageButtons = $('#pageButtons');

            $('#resetQuery').button().click(function () {
                _this.selectedGenres(function (checkbox) {
                    return checkbox.prop('checked', false);
                });
                _this.languageFilter.val(null);
                _this.textSearch.val(null);
                _this.genreChanged(false);

                SearchRequest.Current.language = null;
                SearchRequest.Current.series = null;
                SearchRequest.Current.genres = [];
                SearchRequest.Current.rent = null;
                SearchRequest.Current.text = null;
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

/// <reference path='typings/jquery/jquery.d.ts' />
/// <reference path='typings/jqueryui/jqueryui.d.ts' />
/// <reference path='interfaces.ts' />
/// <reference path='uiHelper.ts' />
/// <reference path='recFilter.ts' />
/// <reference path='recEdit.ts' />
/// <reference path='languageEdit.ts' />
/// <reference path='genreEdit.ts' />
/// <reference path='seriesEdit.ts' />
/// <reference path='containerEdit.ts' />
var MovieDatabase;
(function (MovieDatabase) {
    ;

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

    var Application = (function () {
        function Application() {
            var _this = this;
            this.allSeries = {};
            this.allGenres = {};
            this.allLanguages = {};
            $(function () {
                return _this.startup();
            });
        }
        Application.prototype.migrate = function () {
            var _this = this;
            var legacyFile = $('#theFile');

            var fileInput = (legacyFile[0]);
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

        Application.prototype.buildSeriesMapping = function () {
            var _this = this;
            this.allSeries = {};

            $.each(this.currentApplicationInformation.series, function (index, mapping) {
                mapping.children = [];

                _this.allSeries[mapping.id] = mapping;
            });

            $.each(this.currentApplicationInformation.series, function (index, mapping) {
                if (mapping.parentId == null)
                    return;

                var parent = _this.allSeries[mapping.parentId];

                parent.children.push(mapping);
            });
        };

        Application.prototype.fillApplicationInformation = function (info) {
            var _this = this;
            var busyIndicator = $('#busyIndicator');

            busyIndicator.removeClass(Styles.loading);
            busyIndicator.addClass(Styles.idle);

            this.allGenres = {};
            this.allLanguages = {};

            $.each(info.genres, function (index, genre) {
                return _this.allGenres[genre.id] = genre.name;
            });
            $.each(info.languages, function (index, language) {
                return _this.allLanguages[language.id] = language.name;
            });

            this.currentApplicationInformation = info;

            var migrateButton = $('#migrate');
            if (info.empty)
                migrateButton.removeClass(Styles.invisble);
            else
                migrateButton.addClass(Styles.invisble);

            $('#countInfo').text('(Es gibt ' + info.total + ' Aufzeichnung' + ((info.total == 1) ? '' : 'en') + ')');

            this.buildSeriesMapping();

            this.languageEditor.reset(info.languages);
            this.languageDialog.reset(info.languages);

            this.genreEditor.reset(info.genres);
            this.genreDialog.reset(info.genres);

            this.containerDialog.reset(info.containers);

            this.seriesDialog.reset(info.series);

            Tools.fillSeriesSelection(RecordingEditor.seriesField(), info.series, '(gehört zu keiner Serie)');
            Tools.fillMappingSelection(RecordingEditor.containerField(), info.containers, '(Aufbewahrung nicht bekannt)');

            this.recordingFilter.setLanguages(info.languages);
            this.recordingFilter.setGenres(info.genres);
            this.recordingFilter.setSeries(info.series);

            this.recordingFilter.query();
        };

        /*
        Hier werden die Rohdaten einer Suche nach Aufzeichnungen erst einmal angereichert
        und dann als Tabellenzeilen in die Oberfläche übernommen.
        */
        Application.prototype.fillResultTable = function (results) {
            var _this = this;
            var pageSizeCount = $('#pageSizeCount');
            var pageButtons = $('#pageButtons');
            if (results.total < results.size) {
                pageSizeCount.text('');

                pageButtons.addClass(Styles.invisble);
            } else {
                pageSizeCount.text(' von ' + results.total);

                pageButtons.removeClass(Styles.invisble);
                pageButtons.empty();

                var pagesShown = 20;
                var numberOfPages = Math.floor((results.total + results.size - 1) / results.size);
                var firstIndex = Math.max(0, results.page - 2);
                var lastIndex = Math.min(numberOfPages - 1, firstIndex + pagesShown - 1);

                for (var index = firstIndex; index <= lastIndex; index++)
                    (function (capturedIndex) {
                        var anchor = $('<a href="javascript:void(0)" class="' + Styles.pageButton + '" />').appendTo(pageButtons).button();

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
                                _this.recordingFilter.page = capturedIndex;

                                _this.recordingFilter.query();
                            });
                    })(index);
            }

            // Trefferanzahl für die einzelnen Aufzeichnungsarten einblenden
            this.recordingFilter.setLanguageCounts(results.languages);
            this.recordingFilter.setGenreCounts(results.genres);

            var tableBody = $('#recordingTable>tbody');

            tableBody.empty();

            $.each(results.recordings, function (index, recording) {
                if (recording.series == null)
                    recording.hierarchicalName = recording.title;
                else {
                    var series = _this.allSeries[recording.series];

                    recording.hierarchicalName = series.hierarchicalName + ' ' + _this.currentApplicationInformation.seriesSeparator + ' ' + recording.title;
                }

                var recordingRow = $('<tr></tr>').appendTo(tableBody);

                $('<a />', { text: recording.hierarchicalName, href: '#' + recording.id }).appendTo($('<td />').appendTo(recordingRow));
                $('<td />').appendTo(recordingRow).text($.map(recording.languages, function (language) {
                    return _this.allLanguages[language] || language;
                }).join('; '));
                $('<td />').appendTo(recordingRow).text($.map(recording.genres, function (genre) {
                    return _this.allGenres[genre] || genre;
                }).join('; '));
                $('<td />').appendTo(recordingRow).text(DateTimeTools.toStandard(recording.created));
                $('<td />').appendTo(recordingRow).text(recording.rent);
            });

            this.setMode();
        };

        Application.prototype.requestApplicationInformation = function () {
            var _this = this;
            return $.ajax('movie/info').done(function (info) {
                return _this.fillApplicationInformation(info);
            });
        };

        Application.prototype.resetAllModes = function () {
            $('.operationMode').addClass(Styles.invisble);
        };

        Application.prototype.setMode = function () {
            var _this = this;
            this.resetAllModes();

            var hash = window.location.hash;
            if (hash.length < 2)
                $('#queryMode').removeClass(Styles.invisble);
            else if (hash == '#new')
                this.fillEditForm(null);
            else
                $.ajax('movie/db/' + hash.substring(1)).done(function (recording) {
                    return _this.fillEditForm(recording);
                });
        };

        Application.prototype.fillEditForm = function (recording) {
            this.deleteRecording.disable();

            if (recording != null)
                this.deleteRecording.enable();

            this.currentRecording = new RecordingEditor(recording, this.genreEditor, this.languageEditor);
        };

        Application.prototype.disableSort = function (indicator) {
            indicator.removeClass(Styles.sortedDown);
            indicator.removeClass(Styles.sortedUp);
            indicator.addClass(Styles.notSorted);
        };

        Application.prototype.enableSort = function (indicator) {
            var sortDown = indicator.hasClass(Styles.sortedUp);

            indicator.removeClass(Styles.notSorted);
            indicator.removeClass(sortDown ? Styles.sortedUp : Styles.sortedDown);
            indicator.addClass(sortDown ? Styles.sortedDown : Styles.sortedUp);

            return !sortDown;
        };

        Application.prototype.getChildren = function (series) {
            if ((series == null) || (series.length < 1)) {
                return this.currentApplicationInformation.series.filter(function (s) {
                    return s.parentId == null;
                });
            } else {
                var parent = this.allSeries[series];

                return parent.children;
            }
        };

        Application.prototype.backToQuery = function () {
            window.location.hash = '';

            this.recordingFilter.query();
        };

        Application.prototype.startup = function () {
            var _this = this;
            // Man beachte, dass alle der folgenden Benachrichtigungen immer an den aktuellen Änderungsvorgang koppeln, so dass keine Abmeldung notwendig ist
            var validateRecordingEditForm = function () {
                return _this.currentRecording.validate();
            };

            this.seriesDialog = new SeriesEditor('.openSeriesEditDialog', function () {
                return _this.requestApplicationInformation();
            }, function (series) {
                return _this.getChildren(series);
            });
            this.recordingFilter = new RecordingFilter(function (result) {
                return _this.fillResultTable(result);
            }, function (series) {
                return _this.allSeries[series];
            });
            this.containerDialog = new ContainerEditor('.openContainerEditDialog', function () {
                return _this.requestApplicationInformation();
            });
            this.languageEditor = new MultiValueEditor('#recordingEditLanguage', validateRecordingEditForm);
            this.languageDialog = new LanguageEditor('.openLanguageEditDialog', function () {
                return _this.requestApplicationInformation();
            });
            this.genreEditor = new MultiValueEditor('#recordingEditGenre', validateRecordingEditForm);
            this.genreDialog = new GenreEditor('.openGenreEditDialog', function () {
                return _this.requestApplicationInformation();
            });

            var legacyFile = $('#theFile');
            var migrateButton = $('#migrate');

            legacyFile.change(function () {
                return _this.migrate();
            });
            migrateButton.button().click(function () {
                return legacyFile.click();
            });

            var pageSize = $('#pageSize');
            pageSize.change(function () {
                _this.recordingFilter.size = parseInt(pageSize.val());
                _this.recordingFilter.page = 0;

                _this.recordingFilter.query();
            });

            var sortName = $('#sortName');
            var sortDate = $('#sortDate');

            sortName.click(function () {
                _this.disableSort(sortDate);

                _this.recordingFilter.ascending = _this.enableSort(sortName);
                _this.recordingFilter.order = OrderSelector.title;

                _this.recordingFilter.query();
            });

            sortDate.click(function () {
                _this.disableSort(sortName);

                _this.recordingFilter.ascending = _this.enableSort(sortDate);
                _this.recordingFilter.order = OrderSelector.created;

                _this.recordingFilter.query();
            });

            $('#resetQuery').button().click(function () {
                return _this.recordingFilter.reset(true);
            });

            $('.navigationButton, .editButton').button();

            $('#gotoQuery').click(function () {
                return window.location.hash = '';
            });
            $('#newRecording').click(function () {
                return window.location.hash = 'new';
            });

            this.deleteRecording = new DeleteButton($('#deleteRecording'), function () {
                return _this.currentRecording.remove(function () {
                    return _this.backToQuery();
                });
            });

            RecordingEditor.saveButton().click(function () {
                return _this.currentRecording.save(function () {
                    return _this.backToQuery();
                });
            });
            RecordingEditor.titleField().on('change', validateRecordingEditForm);
            RecordingEditor.titleField().on('input', validateRecordingEditForm);
            RecordingEditor.descriptionField().on('change', validateRecordingEditForm);
            RecordingEditor.descriptionField().on('input', validateRecordingEditForm);
            RecordingEditor.rentField().on('change', validateRecordingEditForm);
            RecordingEditor.rentField().on('input', validateRecordingEditForm);
            RecordingEditor.locationField().on('change', validateRecordingEditForm);
            RecordingEditor.locationField().on('input', validateRecordingEditForm);

            // Allgemeine Informationen zur Anwendung abrufen - eventuell dauert das etwas, da die Datenbank gestartet werden muss
            this.requestApplicationInformation().done(function (info) {
                $('#headline').text('VCR.NET Mediendatenbank');

                // Wir benutzen ein wenige deep linking für einige Aufgaben
                $(window).on('hashchange', function () {
                    return _this.setMode();
                });

                // Ab jetzt sind wir bereit
                $('#main').removeClass(Styles.invisble);
            });
        };
        Application.Current = new Application();
        return Application;
    })();
})(MovieDatabase || (MovieDatabase = {}));
//# sourceMappingURL=appCode.js.map

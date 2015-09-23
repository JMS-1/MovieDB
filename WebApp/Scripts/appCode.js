var MovieDatabase;
(function (MovieDatabase) {
    var Application = (function () {
        function Application() {
            var _this = this;
            this.allSeries = {};
            this.allGenres = {};
            this.allLanguages = {};
            $(function () { return _this.startup(); });
        }
        Application.prototype.refresh = function () {
            var _this = this;
            this.requestApplicationInformation().done(function (info) { return _this.fillApplicationInformation(info); });
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
        Application.prototype.setCountInfo = function (countInFilter) {
            var total = this.currentApplicationInformation.total;
            var text = '(Es gibt ' + total + ' Aufzeichnung';
            if (total != 1)
                text += 'en';
            if (countInFilter != null)
                if (countInFilter < total)
                    if (countInFilter == 1)
                        text += ', eine davon wird angezeigt';
                    else
                        text += ', ' + countInFilter + ' davon werden angezeigt';
            $('#countInfo').text(text + ')');
        };
        Application.prototype.fillApplicationInformation = function (info, currentEdit) {
            var _this = this;
            if (currentEdit === void 0) { currentEdit = null; }
            LinkEditor.urlPattern = new RegExp(info.urlExpression);
            var busyIndicator = $('#busyIndicator');
            busyIndicator.removeClass(Styles.loading);
            busyIndicator.addClass(Styles.idle);
            this.allGenres = {};
            this.allLanguages = {};
            $.each(info.genres, function (index, genre) { return _this.allGenres[genre.id] = genre.name; });
            $.each(info.languages, function (index, language) { return _this.allLanguages[language.id] = language.name; });
            this.currentApplicationInformation = info;
            var migrateButton = $('#migrate');
            if (info.empty)
                migrateButton.removeClass(Styles.invisble);
            else
                migrateButton.addClass(Styles.invisble);
            this.setCountInfo(null);
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
            this.recordingFilter.reset(true, currentEdit);
        };
        /*
          Hier werden die Rohdaten einer Suche nach Aufzeichnungen erst einmal angereichert
          und dann als Tabellenzeilen in die Oberfläche übernommen.
        */
        Application.prototype.fillResultTable = function (results, editInfo) {
            var _this = this;
            this.setCountInfo(results.total);
            var pageButtons = $('#pageButtons');
            if (results.total < results.size) {
                pageButtons.addClass(Styles.invisble);
            }
            else {
                pageButtons.removeClass(Styles.invisble);
                pageButtons.empty();
                var pagesShown = 20;
                var numberOfPages = Math.floor((results.total + results.size - 1) / results.size);
                var firstIndex = Math.max(0, results.page - 2);
                var lastIndex = Math.min(numberOfPages - 1, firstIndex + pagesShown - 1);
                // Sieht ein bißchen komisch aus aber wir wollen zum Aufruf des Lambdas ein Closure auf die Schleifenkontrollvariable erzeugen
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
                        }
                        else if (capturedIndex == results.page - 1) {
                            if (results.page > pagesShown - 4) {
                                anchor.text('<');
                                capturedIndex = results.page - (pagesShown - 4);
                            }
                        }
                        else if (capturedIndex == firstIndex + pagesShown - 2) {
                            if (capturedIndex < numberOfPages - 2)
                                anchor.text('>');
                        }
                        else if (capturedIndex == firstIndex + pagesShown - 1) {
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
                            anchor.click(function () { return _this.recordingFilter.page.val(capturedIndex); });
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
                var titleCell = $('<td class="nameColumn"/>').appendTo(recordingRow);
                $('<a />', { text: recording.hierarchicalName, href: '#' + recording.id }).appendTo(titleCell);
                if (recording.rent != null)
                    $('<div />', { 'class': 'ui-icon ui-icon-transferthick-e-w rentIcon', title: recording.rent }).appendTo(titleCell);
                $('<td class="dateColumn"/>').appendTo(recordingRow).text(Tools.toFullDateWithTime(recording.created));
                $('<td class="languageColumn"/>').appendTo(recordingRow).text($.map(recording.languages, function (language) { return _this.allLanguages[language] || language; }).join('; '));
                $('<td class="genreColumn"/>').appendTo(recordingRow).text($.map(recording.genres, function (genre) { return _this.allGenres[genre] || genre; }).join('; '));
            });
            this.setMode(editInfo);
        };
        Application.prototype.requestApplicationInformation = function (currentEdit) {
            var _this = this;
            if (currentEdit === void 0) { currentEdit = null; }
            return $.ajax('movie/info').done(function (info) { return _this.fillApplicationInformation(info, currentEdit); });
        };
        Application.prototype.resetAllModes = function () {
            $('.operationMode').addClass(Styles.invisble);
        };
        Application.prototype.setMode = function (previousEdit) {
            var _this = this;
            if (previousEdit === void 0) { previousEdit = null; }
            this.resetAllModes();
            var hash = window.location.hash;
            if (hash.length < 2)
                $('#queryMode').removeClass(Styles.invisble);
            else if (previousEdit != null)
                this.fillEditForm(previousEdit);
            else if (hash == '#new')
                this.fillEditForm(null);
            else
                $.ajax('movie/db/' + hash.substring(1)).done(function (recording) { return _this.fillEditForm(recording); });
        };
        Application.prototype.fillEditForm = function (recording) {
            this.deleteRecording.disable();
            if (recording != null)
                if (recording.id != null)
                    this.deleteRecording.enable();
            this.currentRecording = new RecordingEditor(recording, this.genreEditor, this.languageEditor);
        };
        Application.prototype.disableSort = function (indicator) {
            indicator.removeClass(Styles.sortedDown);
            indicator.removeClass(Styles.sortedUp);
            indicator.addClass(Styles.notSorted);
        };
        Application.prototype.enableSort = function (indicator, defaultIsUp) {
            var sortUp = indicator.hasClass(Styles.notSorted) ? defaultIsUp : !indicator.hasClass(Styles.sortedUp);
            indicator.removeClass(Styles.notSorted);
            indicator.removeClass(sortUp ? Styles.sortedDown : Styles.sortedUp);
            indicator.addClass(sortUp ? Styles.sortedUp : Styles.sortedDown);
            return sortUp;
        };
        Application.prototype.getChildren = function (series) {
            if ((series == null) || (series.length < 1)) {
                return this.currentApplicationInformation.series.filter(function (s) { return s.parentId == null; });
            }
            else {
                var parent = this.allSeries[series];
                return parent.children;
            }
        };
        Application.prototype.backToQuery = function () {
            window.location.hash = '';
            this.recordingFilter.query();
        };
        Application.prototype.cloneRecording = function () {
            this.currentRecording.clone();
            this.deleteRecording.disable();
        };
        Application.prototype.featuresDialog = function () {
            return $('#specialFeatureDialog');
        };
        Application.prototype.exportForm = function () {
            return $('#exportForm');
        };
        Application.prototype.doExport = function () {
            this.exportForm().find('input[name="request"]').val(JSON.stringify(this.recordingFilter.createRequest()));
            this.featuresDialog().dialog('close');
        };
        Application.prototype.doBackup = function () {
            var _this = this;
            $.ajax('movie/db/backup', {
                type: 'POST',
                contentType: 'application/json; charset=utf-8',
                data: JSON.stringify({}),
            })
                .done(function () { return _this.featuresDialog().dialog('close'); })
                .fail(function () { return alert('Da ist leider etwas schief gegangen'); });
        };
        Application.prototype.startup = function () {
            var _this = this;
            // Man beachte, dass alle der folgenden Benachrichtigungen immer an den aktuellen Änderungsvorgang koppeln, so dass keine Abmeldung notwendig ist
            var validateRecordingEditForm = function () { return _this.currentRecording.validate(); };
            // Wurde eine Vorschlagsliste verändert, so müssen wir den Neustart abhängig davon machen, ob wir Suchen oder Ändern
            var conditionalReload = function () { return _this.requestApplicationInformation($('#editRecordingMode').hasClass(Styles.invisble) ? null : _this.currentRecording.viewToModel()); };
            this.recordingFilter = new RecordingFilter(function (result, edit) { return _this.fillResultTable(result, edit); }, function (series) { return _this.allSeries[series]; });
            this.languageEditor = new MultiValueEditor('#recordingEditLanguage', validateRecordingEditForm);
            this.seriesDialog = new SeriesEditor('.openSeriesEditDialog', conditionalReload, function (series) { return _this.getChildren(series); });
            this.genreEditor = new MultiValueEditor('#recordingEditGenre', validateRecordingEditForm);
            this.containerDialog = new ContainerEditor('.openContainerEditDialog', conditionalReload);
            this.languageDialog = new LanguageEditor('.openLanguageEditDialog', conditionalReload);
            this.linkDialog = new LinkEditor('.openLinkEditDialog', function () { return _this.currentRecording; });
            this.genreDialog = new GenreEditor('.openGenreEditDialog', conditionalReload);
            var legacyFile = $('#theFile');
            legacyFile.change(function () { return $('#importForm').submit(); });
            $('#migrate').button().click(function () { return legacyFile.click(); });
            $('input[name="pageSize"][value="15"]').prop('checked', true);
            $('input[name="pageSize"]').button().click(function (ev) { return _this.recordingFilter.size.val(parseInt($(ev.target).val())); });
            var sortName = $('#sortName');
            var sortDate = $('#sortDate');
            sortName.click(function () {
                _this.disableSort(sortDate);
                _this.recordingFilter.ascending.val(_this.enableSort(sortName, true));
                _this.recordingFilter.order.val(OrderSelector.title);
                _this.recordingFilter.query();
            });
            sortDate.click(function () {
                _this.disableSort(sortName);
                _this.recordingFilter.ascending.val(_this.enableSort(sortDate, false));
                _this.recordingFilter.order.val(OrderSelector.created);
                _this.recordingFilter.query();
            });
            $('#resetQuery').click(function () { return _this.recordingFilter.reset(true); });
            $('.navigationButton, .editButton').button();
            var exporter = this.exportForm();
            exporter.submit(function () { return _this.doExport(); });
            var features = this.featuresDialog();
            features.find('.dialogCancel').click(function () { return features.dialog('close'); });
            features.find('.dialogBackup').click(function () { return _this.doBackup(); });
            features.find('.dialogExport').click(function () { return exporter.submit(); });
            $('#newRecording').click(function () { return window.location.hash = 'new'; });
            $('#gotoQuery').click(function () { return _this.backToQuery(); });
            $('#busyIndicator').click(function () {
                Tools.openDialog(features);
                features.dialog('option', 'width', '70%');
            });
            this.deleteRecording = new DeleteButton(RecordingEditor.deleteButton(), function () { return _this.currentRecording.remove(function () { return _this.backToQuery(); }); });
            RecordingEditor.saveButton().click(function () { return _this.currentRecording.save(function () { return _this.backToQuery(); }); });
            RecordingEditor.cloneButton().click(function () { return _this.cloneRecording(); });
            RecordingEditor.saveAndCloneButton().click(function () { return _this.currentRecording.save(function () { return _this.cloneRecording(); }); });
            RecordingEditor.saveAndNewButton().click(function () { return _this.currentRecording.save(function () {
                if (window.location.hash == '#new')
                    _this.setMode();
                else
                    window.location.hash = 'new';
            }); });
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
                $(window).on('hashchange', function () { return _this.setMode(); });
                // Ab jetzt sind wir bereit
                $('#main').removeClass(Styles.invisble);
            });
        };
        Application.Current = new Application();
        return Application;
    })();
})(MovieDatabase || (MovieDatabase = {}));
//# sourceMappingURL=appCode.js.map
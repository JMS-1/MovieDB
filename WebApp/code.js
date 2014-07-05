var MovieDatabase;
(function (MovieDatabase) {
    ;

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

            this.recordingFilter.reset(true);
        };

        /*
        Hier werden die Rohdaten einer Suche nach Aufzeichnungen erst einmal angereichert
        und dann als Tabellenzeilen in die Oberfläche übernommen.
        */
        Application.prototype.fillResultTable = function (results) {
            var _this = this;
            this.setCountInfo(results.total);

            var pageButtons = $('#pageButtons');
            if (results.total < results.size) {
                pageButtons.addClass(Styles.invisble);
            } else {
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
                                return _this.recordingFilter.page.val(capturedIndex);
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

                var titleCell = $('<td class="nameColumn"/>').appendTo(recordingRow);
                $('<a />', { text: recording.hierarchicalName, href: '#' + recording.id }).appendTo(titleCell);

                if (recording.rent != null)
                    $('<div />', { 'class': 'ui-icon ui-icon-transferthick-e-w rentIcon', title: recording.rent }).appendTo(titleCell);

                $('<td class="dateColumn"/>').appendTo(recordingRow).text(Tools.toFullDateWithTime(recording.created));
                $('<td class="languageColumn"/>').appendTo(recordingRow).text($.map(recording.languages, function (language) {
                    return _this.allLanguages[language] || language;
                }).join('; '));
                $('<td class="genreColumn"/>').appendTo(recordingRow).text($.map(recording.genres, function (genre) {
                    return _this.allGenres[genre] || genre;
                }).join('; '));
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

        Application.prototype.enableSort = function (indicator, defaultIsUp) {
            var sortUp = indicator.hasClass(Styles.notSorted) ? defaultIsUp : !indicator.hasClass(Styles.sortedUp);

            indicator.removeClass(Styles.notSorted);
            indicator.removeClass(sortUp ? Styles.sortedDown : Styles.sortedUp);
            indicator.addClass(sortUp ? Styles.sortedUp : Styles.sortedDown);

            return sortUp;
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

        Application.prototype.cloneRecording = function () {
            this.currentRecording.clone();
            this.deleteRecording.disable();
        };

        Application.prototype.featuresDialog = function () {
            return $('#specialFeatureDialog');
        };

        Application.prototype.doBackup = function () {
            var _this = this;
            $.ajax('movie/db/backup', {
                type: 'POST',
                contentType: 'application/json; charset=utf-8',
                data: JSON.stringify({})
            }).done(function () {
                return _this.featuresDialog().dialog('close');
            }).fail(function () {
                return alert('Da ist leider etwas schief gegangen');
            });
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

            $('input[name="pageSize"][value="15"]').prop('checked', true);
            $('input[name="pageSize"]').button().click(function (ev) {
                return _this.recordingFilter.size.val(parseInt($(ev.target).val()));
            });

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

            $('#resetQuery').click(function () {
                return _this.recordingFilter.reset(true);
            });

            $('.navigationButton, .editButton').button();

            var features = this.featuresDialog();
            features.find('.dialogCancel').click(function () {
                return features.dialog('close');
            });
            features.find('.dialogBackup').click(function () {
                return _this.doBackup();
            });

            $('#newRecording').click(function () {
                return window.location.hash = 'new';
            });
            $('#gotoQuery').click(function () {
                return _this.backToQuery();
            });
            $('#busyIndicator').click(function () {
                Tools.openDialog(features);

                features.dialog('option', 'width', '70%');
            });

            this.deleteRecording = new DeleteButton(RecordingEditor.deleteButton(), function () {
                return _this.currentRecording.remove(function () {
                    return _this.backToQuery();
                });
            });

            RecordingEditor.saveButton().click(function () {
                return _this.currentRecording.save(function () {
                    return _this.backToQuery();
                });
            });
            RecordingEditor.cloneButton().click(function () {
                return _this.cloneRecording();
            });
            RecordingEditor.saveAndCloneButton().click(function () {
                return _this.currentRecording.save(function () {
                    return _this.cloneRecording();
                });
            });
            RecordingEditor.saveAndNewButton().click(function () {
                return _this.currentRecording.save(function () {
                    if (window.location.hash == '#new')
                        _this.setMode();
                    else
                        window.location.hash = 'new';
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
var ContainerEditor = (function () {
    function ContainerEditor(openButtonSelector, reloadApplicationData) {
        var _this = this;
        this.identifier = null;
        this.reload = reloadApplicationData;

        this.childTable().accordion(Styles.accordionSettings);
        this.recordingTable().accordion(Styles.accordionSettings);

        this.confirmedDelete = new DeleteButton(this.dialog().find('.dialogDelete'), function () {
            return _this.remove();
        });

        $(openButtonSelector).click(function () {
            return _this.open();
        });

        this.saveButton().click(function () {
            return _this.save();
        });
        this.cancelButton().click(function () {
            return _this.close();
        });

        this.descriptionField().on('change', function () {
            return _this.validate();
        });
        this.descriptionField().on('input', function () {
            return _this.validate();
        });
        this.nameField().on('change', function () {
            return _this.validate();
        });
        this.nameField().on('input', function () {
            return _this.validate();
        });
        this.parentChooser().change(function () {
            return _this.validate();
        });
        this.chooser().change(function () {
            return _this.choose();
        });
    }
    ContainerEditor.prototype.open = function () {
        this.chooser().val('');
        this.choose();

        Tools.openDialog(this.dialog());

        // Wir positionieren uns etwas weiter oben als die anderen Dialog, da wir eine dynamische Größe haben können
        this.dialog().dialog('option', 'position', { of: '#main', at: 'center top', my: 'center top' });
    };

    ContainerEditor.prototype.close = function () {
        this.dialog().dialog('close');
    };

    ContainerEditor.prototype.restart = function () {
        this.close();

        // Wichtig ist, dass wir die neuen Listen in die Oberfläche laden
        this.reload();
    };

    ContainerEditor.prototype.createUpdate = function () {
        var newData = {
            description: (this.descriptionField().val() || '').trim(),
            location: (this.locationField().val() || '').trim(),
            name: (this.nameField().val() || '').trim(),
            parent: this.parentChooser().val(),
            type: this.typeField().val()
        };

        return newData;
    };

    ContainerEditor.prototype.reset = function (list) {
        Tools.fillMappingSelection(this.chooser(), list, '(Neue Aufbewahrung anlegen)');
        Tools.fillMappingSelection(this.parentChooser(), list, '(Keine)');
    };

    ContainerEditor.prototype.validate = function (newData) {
        if (typeof newData === "undefined") { newData = null; }
        if (newData == null)
            newData = this.createUpdate();

        var isValid = true;

        if (Tools.setError(this.nameField(), this.validateName(newData)))
            isValid = false;
        if (Tools.setError(this.descriptionField(), this.validateDescription(newData)))
            isValid = false;
        if (Tools.setError(this.locationField(), this.validateLocation(newData)))
            isValid = false;

        this.saveButton().button('option', 'disabled', !isValid);

        return isValid;
    };

    ContainerEditor.prototype.fillChildTable = function (containers) {
        var table = this.childTable();
        var count = containers.length;

        if (count > 0) {
            if (count == 1)
                table.find('.ui-accordion-header>span').text('Eine Aufbewahrung');
            else
                table.find('.ui-accordion-header>span').text(count + ' Aufbewahrungen');

            var content = table.find('tbody');

            content.empty();

            $.each(containers, function (index, container) {
                return $('<td />').text(container).appendTo($('<tr />').appendTo(content));
            });

            table.removeClass(Styles.invisble);

            table.accordion('option', 'active', false);
        } else
            table.addClass(Styles.invisble);
    };

    ContainerEditor.prototype.fillRecordingTable = function (recordings) {
        var table = this.recordingTable();
        var count = recordings.length;
        if (count > 0) {
            if (count == 1)
                table.find('.ui-accordion-header>span').text('Eine Aufzeichnung');
            else
                table.find('.ui-accordion-header>span').text(count + ' Aufzeichnungen');

            var content = table.find('tbody');

            content.empty();

            $.each(recordings, function (index, recording) {
                var row = $('<tr />').appendTo(content);

                $('<td />').text(recording.name).appendTo(row);
                $('<td />').text(recording.position).appendTo(row);
            });

            table.removeClass(Styles.invisble);

            table.accordion('option', 'active', false);
        } else
            table.addClass(Styles.invisble);
    };

    ContainerEditor.prototype.choose = function () {
        var _this = this;
        // Die aktuelle Auswahl ermitteln
        var choosen = this.chooser().val();

        // Und dann ganz defensiv erst einmal alles zurück setzen
        this.saveButton().button('option', 'disabled', choosen.length > 0);
        this.confirmedDelete.disable();

        this.dialog().find('.collapsableCount').text(null);

        this.descriptionField().val('');
        this.parentChooser().val('');
        this.locationField().val('');
        this.nameField().val('');
        this.typeField().val('0');

        if (choosen.length < 1) {
            this.childTable().addClass(Styles.invisble);
            this.recordingTable().addClass(Styles.invisble);

            // Einfach ist es, wenn wir etwas neu Anlegen
            this.identifier = '';

            this.validate();
        } else {
            // Ansonsten fragen wir den Web Service immer nach dem neuesten Stand
            this.identifier = null;

            $.ajax('movie/container/' + choosen).done(function (info) {
                if (info == null)
                    return;

                _this.identifier = info.id;

                _this.descriptionField().val(info.description);
                _this.typeField().val(info.type.toString());
                _this.locationField().val(info.location);
                _this.parentChooser().val(info.parent);
                _this.nameField().val(info.name);

                _this.fillChildTable(info.children);
                _this.fillRecordingTable(info.recordings);
                _this.confirmedDelete.enable();

                // Für den unwahrscheinlichen Fall, dass sich die Spielregeln verändert haben - und um die Schaltfläche zum Speichern zu aktivieren
                _this.validate();
            });
        }
    };

    ContainerEditor.prototype.remove = function () {
        var _this = this;
        if (this.identifier == null)
            return;
        if (this.identifier.length < 1)
            return;

        $.ajax('movie/container/' + this.identifier, {
            type: 'DELETE'
        }).done(function () {
            return _this.restart();
        }).fail(function () {
            // Bei der Fehlerbehandlung ist noch Potential
            alert('Da ist leider etwas schief gegangen');
        });
    };

    ContainerEditor.prototype.save = function () {
        var _this = this;
        if (this.identifier == null)
            return;

        var newData = this.createUpdate();

        // Vorsichtshalbe schauen wir noch einmal nach, ob das alles so in Ordnung geht
        if (!this.validate(newData))
            return;

        var url = 'movie/container';
        if (this.identifier.length > 0)
            url += '/' + this.identifier;

        $.ajax(url, {
            type: (this.identifier.length < 1) ? 'POST' : 'PUT',
            contentType: 'application/json; charset=utf-8',
            data: JSON.stringify(newData)
        }).done(function () {
            return _this.restart();
        }).fail(function () {
            // Bei der Fehlerbehandlung ist noch Potential
            alert('Da ist leider etwas schief gegangen');
        });
    };

    // Alles was jetzt kommt sind eigentlich die abstrakten Methoden der Basisklasse
    ContainerEditor.prototype.dialog = function () {
        return $('#containerEditDialog');
    };

    ContainerEditor.prototype.chooser = function () {
        return this.dialog().find('.selectName');
    };

    ContainerEditor.prototype.parentChooser = function () {
        return this.dialog().find('.editParent');
    };

    ContainerEditor.prototype.saveButton = function () {
        return this.dialog().find('.dialogSave');
    };

    ContainerEditor.prototype.cancelButton = function () {
        return this.dialog().find('.dialogCancel');
    };

    ContainerEditor.prototype.nameField = function () {
        return this.dialog().find('.editName');
    };

    ContainerEditor.prototype.descriptionField = function () {
        return this.dialog().find('.editDescription');
    };

    ContainerEditor.prototype.typeField = function () {
        return this.dialog().find('.chooseType');
    };

    ContainerEditor.prototype.locationField = function () {
        return this.dialog().find('.editLocation');
    };

    ContainerEditor.prototype.childTable = function () {
        return this.dialog().find('.containerChildren');
    };

    ContainerEditor.prototype.recordingTable = function () {
        return this.dialog().find('.containerRecordings');
    };

    ContainerEditor.prototype.validateName = function (newData) {
        var name = newData.name;

        if (name.length < 1)
            return 'Es muss ein Name angegeben werden';
        else if (name.length > 50)
            return 'Der Name darf maximal 50 Zeichen haben';
        else if (Tools.checkCollision(this.chooser(), newData.name, this.identifier))
            return 'Der Name wird bereits verwendet';
        else
            return null;
    };

    ContainerEditor.prototype.validateDescription = function (newData) {
        var description = newData.description;

        if (description.length > 2000)
            return 'Der Standort darf maximal 2000 Zeichen haben';
        else
            return null;
    };

    ContainerEditor.prototype.validateLocation = function (newData) {
        var location = newData.location;

        if (location.length > 100)
            return 'Der Position in der übergeordnete Aufzeichnung darf maximal 100 Zeichen haben';
        else
            return null;
    };
    return ContainerEditor;
})();
var Styles = (function () {
    function Styles() {
    }
    Styles.invisble = 'invisible';

    Styles.loading = 'ui-icon-power';

    Styles.busy = 'ui-icon-refresh';

    Styles.idle = 'ui-icon-check';

    Styles.expanded = 'ui-icon-triangle-1-s';

    Styles.collapsed = 'ui-icon-triangle-1-e';

    Styles.pageButton = 'pageButton';

    Styles.activePageButton = 'pageButtonSelected';

    Styles.notSorted = 'ui-icon-arrowthick-2-n-s';

    Styles.sortedUp = 'ui-icon-arrowthick-1-n';

    Styles.sortedDown = 'ui-icon-arrowthick-1-s';

    Styles.inputError = 'validationError';

    Styles.deleteConfirmation = 'deleteConfirm';

    Styles.treeNode = 'treeNode';

    Styles.treeItem = 'treeItem';

    Styles.nodeHeader = 'treeNodeHeader';

    Styles.selectedNode = 'nodeSelected';

    Styles.accordionSettings = {
        active: false,
        animate: false,
        collapsible: true,
        heightStyle: 'content'
    };
    return Styles;
})();

var Tools = (function () {
    function Tools() {
    }
    Tools.setError = function (field, message) {
        if (message == null) {
            field.removeClass(Styles.inputError);
            field.removeAttr('title');

            return false;
        } else {
            field.addClass(Styles.inputError);
            field.attr('title', message);

            return true;
        }
    };

    Tools.fillMappingSelection = function (selector, items, nullSelection) {
        Tools.fillSelection(selector, items, nullSelection, function (item) {
            return item.id;
        }, function (item) {
            return item.name;
        });
    };

    Tools.fillSeriesSelection = function (selector, series, nullSelection) {
        Tools.fillSelection(selector, series, nullSelection, function (s) {
            return s.id;
        }, function (s) {
            return s.hierarchicalName;
        });
    };

    Tools.fillSelection = function (selector, items, nullSelection, getValue, getText) {
        selector.empty();

        $('<option />', { text: nullSelection, value: '' }).appendTo(selector);

        $.each(items, function (index, item) {
            return $('<option />', { text: getText(item), value: getValue(item) }).appendTo(selector);
        });
    };

    Tools.checkCollision = function (selector, name, identifier) {
        var existing = selector.find('option');

        for (var i = 1; i < existing.length; i++)
            if (existing[i].innerHTML == name)
                if (existing[i].getAttribute('value') != identifier)
                    return true;

        return false;
    };

    Tools.openDialog = function (dialog) {
        dialog.dialog({
            position: { of: '#main', at: 'center top+100', my: 'center top' },
            closeOnEscape: true,
            width: 'auto',
            modal: true
        });
    };

    // Erstellt das Standardeinzeigeformat für ein Datum mit Uhrzeit.
    Tools.toFullDateWithTime = function (dateTime) {
        // Eine zweistellig Zahl erzeugen
        var formatNumber = function (val) {
            return (val < 10) ? ('0' + val.toString()) : val.toString();
        };

        return formatNumber(dateTime.getDate()) + '.' + formatNumber(1 + dateTime.getMonth()) + '.' + dateTime.getFullYear().toString() + ' ' + formatNumber(dateTime.getHours()) + ':' + formatNumber(dateTime.getMinutes()) + ':' + formatNumber(dateTime.getSeconds());
    };
    return Tools;
})();

var MultiValueEditor = (function () {
    function MultiValueEditor(containerSelector, onChange) {
        this.onChange = onChange;

        this.container = $(containerSelector);
    }
    MultiValueEditor.prototype.val = function (newVal) {
        if (newVal) {
            var map = {};
            $.each(newVal, function (index, id) {
                return map[id] = true;
            });

            $.each(this.container.find('input[type=checkbox]'), function (index, checkbox) {
                var selector = $(checkbox);

                selector.prop('checked', map[selector.val()] == true).button('refresh');
            });

            return newVal;
        } else {
            var value = [];

            $.each(this.container.find('input[type=checkbox]:checked'), function (index, checkbox) {
                return value.push($(checkbox).val());
            });

            return value;
        }
    };

    MultiValueEditor.prototype.reset = function (items) {
        var _this = this;
        // Zuerst merken wir uns mal die aktuelle Einstellung
        var previousValue = this.val();

        // Dann wird die Oberfläche zurück gesetzt
        this.container.empty();

        // Und ganz neu aufgebaut
        $.each(items, function (index, item) {
            var id = "mve" + (++MultiValueEditor.idCounter);

            var checkbox = $('<input />', { type: 'checkbox', id: id, value: item.id }).appendTo(_this.container).click(function () {
                return _this.onChange();
            });
            var label = $('<label />', { 'for': id, text: item.name }).appendTo(_this.container);

            checkbox.button();
        });

        // Alle Werte, die wir ausgewählt haben, werden wieder aktiviert - sofern sie bekannt sind
        this.val(previousValue);
    };
    MultiValueEditor.idCounter = 0;
    return MultiValueEditor;
})();

// Diese Basisklasse unterstützt die Pflege der festen Auswahllisten für Sprachen und Kategorien
var SuggestionListEditor = (function () {
    function SuggestionListEditor(openButtonSelector, reloadApplicationData) {
        var _this = this;
        this.identifier = null;
        this.reload = reloadApplicationData;

        this.confirmedDelete = new DeleteButton(this.dialog().find('.dialogDelete'), function () {
            return _this.remove();
        });

        $(openButtonSelector).click(function () {
            return _this.open();
        });

        this.saveButton().click(function () {
            return _this.save();
        });
        this.cancelButton().click(function () {
            return _this.close();
        });

        this.nameField().on('change', function () {
            return _this.validate();
        });
        this.nameField().on('input', function () {
            return _this.validate();
        });
        this.chooser().change(function () {
            return _this.choose();
        });
    }
    SuggestionListEditor.prototype.open = function () {
        // Vorher noch einmal schnell alles aufbereiten
        this.chooser().val('');
        this.choose();

        Tools.openDialog(this.dialog());
    };

    SuggestionListEditor.prototype.close = function () {
        this.dialog().dialog('close');
    };

    SuggestionListEditor.prototype.restart = function () {
        this.close();

        // Wichtig ist, dass wir die neuen Listen in die Oberfläche laden
        this.reload();
    };

    SuggestionListEditor.prototype.createUpdate = function () {
        var newData = {
            name: (this.nameField().val() || '').trim(),
            id: null
        };

        // Der Downcast ist etwas unsauber, aber wir wissen hier genau, was wir tun
        return newData;
    };

    SuggestionListEditor.prototype.reset = function (list) {
        Tools.fillSelection(this.chooser(), list, this.createNewOption(), function (i) {
            return i.id;
        }, function (i) {
            return i.name;
        });
    };

    SuggestionListEditor.prototype.validate = function (newData) {
        if (typeof newData === "undefined") { newData = null; }
        if (newData == null)
            newData = this.createUpdate();

        var isValid = true;

        var nameError = this.validateName(newData);
        if (nameError == null)
            if (Tools.checkCollision(this.chooser(), newData.name, this.identifier))
                nameError = "Der Name wird bereits verwendet";

        if (Tools.setError(this.nameField(), nameError))
            isValid = false;

        this.saveButton().button('option', 'disabled', !isValid);

        return isValid;
    };

    SuggestionListEditor.prototype.choose = function () {
        var _this = this;
        // Die aktuelle Auswahl ermitteln
        var choosen = this.chooser().val();

        // Und dann ganz defensiv erst einmal alles zurück setzen
        this.saveButton().button('option', 'disabled', true);
        this.confirmedDelete.disable();

        this.nameField().val('');

        if (choosen.length < 1) {
            // Einfach ist es, wenn wir etwas neu Anlegen
            this.identifier = '';

            this.validate();
        } else {
            // Ansonsten fragen wir den Web Service immer nach dem neuesten Stand
            this.identifier = null;

            $.ajax('movie/' + this.controllerName() + '/' + choosen).done(function (info) {
                if (info == null)
                    return;

                _this.identifier = info.id;
                _this.nameField().val(info.name);

                // Einträge der Voschlaglisten dürfen nur gelöscht werden, wenn sie nicht in Verwendung sind
                if (info.unused)
                    _this.confirmedDelete.enable();

                // Für den unwahrscheinlichen Fall, dass sich die Spielregeln verändert haben - und um die Schaltfläche zum Speichern zu aktivieren
                _this.validate();
            });
        }
    };

    SuggestionListEditor.prototype.remove = function () {
        var _this = this;
        if (this.identifier == null)
            return;
        if (this.identifier.length < 1)
            return;

        $.ajax('movie/' + this.controllerName() + '/' + this.identifier, { type: 'DELETE' }).done(function () {
            return _this.restart();
        }).fail(function () {
            return alert('Da ist leider etwas schief gegangen');
        });
    };

    SuggestionListEditor.prototype.save = function () {
        var _this = this;
        if (this.identifier == null)
            return;

        var newData = this.createUpdate();

        // Vorsichtshalbe schauen wir noch einmal nach, ob das alles so in Ordnung geht
        if (!this.validate(newData))
            return;

        var url = 'movie/' + this.controllerName();
        if (this.identifier.length > 0)
            url += '/' + this.identifier;

        $.ajax(url, {
            type: (this.identifier.length > 0) ? 'PUT' : 'POST',
            contentType: 'application/json; charset=utf-8',
            data: JSON.stringify(newData)
        }).done(function () {
            return _this.restart();
        }).fail(function () {
            return alert('Da ist leider etwas schief gegangen');
        });
    };

    SuggestionListEditor.prototype.chooser = function () {
        return this.dialog().find('.selectKey');
    };

    SuggestionListEditor.prototype.saveButton = function () {
        return this.dialog().find('.dialogSave');
    };

    SuggestionListEditor.prototype.cancelButton = function () {
        return this.dialog().find('.dialogCancel');
    };

    SuggestionListEditor.prototype.nameField = function () {
        return this.dialog().find('.editName');
    };

    // Alles was jetzt kommt sind eigentlich die abstrakten Methoden der Basisklasse
    SuggestionListEditor.prototype.controllerName = function () {
        throw 'Bitte controllerName implementieren';
    };

    SuggestionListEditor.prototype.createNewOption = function () {
        throw 'Bitte createNewOption implementieren';
    };

    SuggestionListEditor.prototype.dialog = function () {
        throw 'Bitte dialog implementieren';
    };

    SuggestionListEditor.prototype.validateName = function (newData) {
        throw 'Bitte validateName implementieren';
    };
    return SuggestionListEditor;
})();

// Beim Löschen verzichten wir auf eine explizite Rückfrage sondern erzwingen einfach das
// doppelte Betätigung der Schaltfläche nach einem visuellen Feedback mit dem ersten Drücken.
var DeleteButton = (function () {
    function DeleteButton(button, process) {
        var _this = this;
        this.button = button.click(function () {
            return _this.remove();
        });
        this.process = process;
    }
    DeleteButton.prototype.disable = function () {
        this.button.removeClass(Styles.deleteConfirmation);
        this.button.removeAttr('title');
        this.button.button('option', 'disabled', true);
    };

    DeleteButton.prototype.enable = function () {
        this.button.button('option', 'disabled', false);
    };

    DeleteButton.prototype.remove = function () {
        if (this.button.hasClass(Styles.deleteConfirmation))
            this.process();
        else {
            this.button.addClass(Styles.deleteConfirmation);
            this.button.attr('title', 'Noch einmal Drücken zum unwiederruflichen Löschen');
        }
    };
    return DeleteButton;
})();
/// <reference path="uihelper.ts" />
var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
// Pflegt die Vorgabeliste der Kategorien
var GenreEditor = (function (_super) {
    __extends(GenreEditor, _super);
    function GenreEditor(openButtonSelector, reloadApplicationData) {
        _super.call(this, openButtonSelector, reloadApplicationData);
    }
    GenreEditor.prototype.dialog = function () {
        return $('#genreEditDialog');
    };

    GenreEditor.prototype.controllerName = function () {
        return 'genre';
    };

    GenreEditor.prototype.createNewOption = function () {
        return '(neue Kategorie anlegen)';
    };

    GenreEditor.prototype.validateName = function (genre) {
        var name = genre.name;

        if (name.length < 1)
            return 'Es muss ein Name angegeben werden';
        else if (name.length > 100)
            return 'Der Name darf maximal 100 Zeichen haben';
        else
            return null;
    };
    GenreEditor.namePattern = /^[0-9A-Za-zäöüÄÖÜß]{1,20}$/;
    return GenreEditor;
})(SuggestionListEditor);




// Die Eigenschaften, nach denen Aufzeichnungen sortiert werden können
var OrderSelector = (function () {
    function OrderSelector() {
    }
    OrderSelector.title = 'titleWithSeries';

    OrderSelector.created = 'date';
    return OrderSelector;
})();


;

/// <reference path="uihelper.ts" />
// Pflegt die Vorgabeliste der Sprachen
var LanguageEditor = (function (_super) {
    __extends(LanguageEditor, _super);
    function LanguageEditor(openButtonSelector, reloadApplicationData) {
        _super.call(this, openButtonSelector, reloadApplicationData);
    }
    LanguageEditor.prototype.dialog = function () {
        return $('#languageEditDialog');
    };

    LanguageEditor.prototype.controllerName = function () {
        return 'language';
    };

    LanguageEditor.prototype.createNewOption = function () {
        return '(neue Sprache anlegen)';
    };

    LanguageEditor.prototype.validateName = function (language) {
        var name = language.name;

        if (name.length < 1)
            return 'Es muss ein Name angegeben werden';
        else if (name.length > 100)
            return 'Der Name darf maximal 100 Zeichen haben';
        else
            return null;
    };
    LanguageEditor.namePattern = /^[a-z]{2}$/;
    return LanguageEditor;
})(SuggestionListEditor);
// Basisklasse für ein einfaches Modell mit nur einem Wert
var Model = (function () {
    function Model(initialValue) {
        this.onChange = [];
        this.value = initialValue;
    }
    // Hier kann sich ein Interessent an Änderungen des einzigen Wertes anmelden
    Model.prototype.change = function (callback) {
        if (callback != null)
            this.onChange.push(callback);
    };

    Model.prototype.onChanged = function () {
        $.each(this.onChange, function (index, callback) {
            return callback();
        });
    };

    Model.prototype.val = function (newValue) {
        if (typeof newValue === "undefined") { newValue = undefined; }
        // Vielleicht will ja nur jemand den aktuellen Wert kennen lernen
        if (newValue !== undefined) {
            if (newValue != this.value) {
                this.value = newValue;

                // Wenn sich der Wert verändert hat, dann müssen wir alle Interessenten informieren
                this.onChanged();
            }
        }

        // Wir melden immer den nun aktuellen Wert
        return this.value;
    };
    return Model;
})();

// Ein Element in einer hierarchischen Ansicht kann ausgewählt werden
var TreeItemModel = (function () {
    function TreeItemModel(item) {
        this.selected = new Model(false);
        this.id = item.id;
        this.fullName = item.hierarchicalName;
    }
    return TreeItemModel;
})();

// Ein Blatt in einer hierarchischen Ansicht kann nur ausgewählt werden
var TreeLeafModel = (function (_super) {
    __extends(TreeLeafModel, _super);
    function TreeLeafModel(item) {
        _super.call(this, item);
    }
    return TreeLeafModel;
})(TreeItemModel);

// Ein Knoten in einer hierarchischen Ansicht kann zusätzlicher zur Auswahl auch auf- und zugeklappt werden
var TreeNodeModel = (function (_super) {
    __extends(TreeNodeModel, _super);
    function TreeNodeModel(item) {
        _super.call(this, item);
        this.expanded = new Model(false);
    }
    return TreeNodeModel;
})(TreeItemModel);
// Der Dialog zum Pflegen einer Aufzeichnung - diese Instanzen werden für jeden Änderungsvorgang neu erzeugt
var RecordingEditor = (function () {
    function RecordingEditor(recording, genreEditor, languageEditor) {
        this.languageEditor = languageEditor;
        this.genreEditor = genreEditor;

        if (recording == null) {
            this.identifier = null;
            RecordingEditor.descriptionField().val('');
            RecordingEditor.containerField().val('');
            RecordingEditor.locationField().val('');
            RecordingEditor.mediaField().val('0');
            RecordingEditor.seriesField().val('');
            RecordingEditor.titleField().val('');
            RecordingEditor.rentField().val('');

            this.languageEditor.val([]);
            this.genreEditor.val([]);
        } else {
            this.identifier = recording.id;
            RecordingEditor.mediaField().val(recording.mediaType.toString());
            RecordingEditor.descriptionField().val(recording.description);
            RecordingEditor.containerField().val(recording.container);
            RecordingEditor.locationField().val(recording.location);
            RecordingEditor.seriesField().val(recording.series);
            RecordingEditor.titleField().val(recording.title);
            RecordingEditor.rentField().val(recording.rent);

            this.languageEditor.val(recording.languages);
            this.genreEditor.val(recording.genres);
        }

        this.validate();

        $('#editRecordingMode').removeClass(Styles.invisble);
    }
    RecordingEditor.saveButton = function () {
        return $('#updateRecording');
    };

    RecordingEditor.saveAndNewButton = function () {
        return $('#newAfterUpdateRecording');
    };

    RecordingEditor.saveAndCloneButton = function () {
        return $('#cloneAfterUpdateRecording');
    };

    RecordingEditor.cloneButton = function () {
        return $('#cloneRecording');
    };

    RecordingEditor.deleteButton = function () {
        return $('#deleteRecording');
    };

    RecordingEditor.titleField = function () {
        return $('#recordingEditTitle');
    };

    RecordingEditor.descriptionField = function () {
        return $('#recordingEditDescription');
    };

    RecordingEditor.seriesField = function () {
        return $('#recordingEditSeries');
    };

    RecordingEditor.mediaField = function () {
        return $('#recordingEditMedia');
    };

    RecordingEditor.genreField = function () {
        return $('#recordingEditGenre');
    };

    RecordingEditor.languageField = function () {
        return $('#recordingEditLanguage');
    };

    RecordingEditor.containerField = function () {
        return $('#recordingEditContainer');
    };

    RecordingEditor.locationField = function () {
        return $('#recordingEditLocation');
    };

    RecordingEditor.rentField = function () {
        return $('#recordingEditRent');
    };

    RecordingEditor.prototype.save = function (success) {
        var newData = this.viewToModel();

        if (!this.validate(newData))
            return;

        var url = 'movie/db';
        if (this.identifier != null)
            url += '/' + this.identifier;

        $.ajax(url, {
            type: (this.identifier == null) ? 'POST' : 'PUT',
            contentType: 'application/json; charset=utf-8',
            data: JSON.stringify(newData)
        }).done(success).fail(function () {
            return alert('Da ist leider etwas schief gegangen');
        });
    };

    RecordingEditor.prototype.remove = function (success) {
        if (this.identifier == null)
            return;

        $.ajax('movie/db/' + this.identifier, { type: 'DELETE' }).done(success).fail(function () {
            return alert('Da ist leider etwas schief gegangen');
        });
    };

    // Behält alle EIngabedaten bis auf den Titel bei und markiert die aktuelle Aufzeichnung als
    // eine neu angelegte Aufzeichnung. Der Titel erhält einen entsprechenden Zusatz.
    RecordingEditor.prototype.clone = function () {
        RecordingEditor.titleField().val('Kopie von ' + (RecordingEditor.titleField().val() || '').trim());

        this.identifier = null;

        this.validate();
    };

    // Überträgt die Eingabefelder in die zugehörige Datenstruktur.
    RecordingEditor.prototype.viewToModel = function () {
        var newData = {
            description: (RecordingEditor.descriptionField().val() || '').trim(),
            location: (RecordingEditor.locationField().val() || '').trim(),
            title: (RecordingEditor.titleField().val() || '').trim(),
            mediaType: parseInt(RecordingEditor.mediaField().val()),
            rent: (RecordingEditor.rentField().val() || '').trim(),
            container: RecordingEditor.containerField().val(),
            series: RecordingEditor.seriesField().val(),
            languages: this.languageEditor.val(),
            genres: this.genreEditor.val(),
            id: null
        };

        return newData;
    };

    RecordingEditor.prototype.validateTitle = function (recording) {
        var title = recording.title;

        if (title.length < 1)
            return 'Es muss ein Name angegeben werden';
        else if (title.length > 200)
            return 'Der Name darf maximal 200 Zeichen haben';
        else
            return null;
    };

    RecordingEditor.prototype.validateDescription = function (recording) {
        var description = recording.description;

        if (description.length > 2000)
            return 'Die Beschreibung darf maximal 2.000 Zeichen haben';
        else
            return null;
    };

    RecordingEditor.prototype.validateRentTo = function (recording) {
        var rent = recording.rent;

        if (rent.length > 200)
            return 'Der Name des Entleihers darf maximal 200 Zeichen haben';
        else
            return null;
    };

    RecordingEditor.prototype.validateLocation = function (recording) {
        var location = recording.location;

        if (location.length > 100)
            return 'Die Position im Container darf maximal 100 Zeichen haben';
        else
            return null;
    };

    RecordingEditor.prototype.validate = function (recording) {
        if (typeof recording === "undefined") { recording = null; }
        var isValid = true;

        if (recording == null)
            recording = this.viewToModel();

        // Wir prüfen im wesentlichen die Freitextfelder auf deren Länge
        if (Tools.setError(RecordingEditor.titleField(), this.validateTitle(recording)))
            isValid = false;
        if (Tools.setError(RecordingEditor.descriptionField(), this.validateDescription(recording)))
            isValid = false;
        if (Tools.setError(RecordingEditor.rentField(), this.validateRentTo(recording)))
            isValid = false;
        if (Tools.setError(RecordingEditor.locationField(), this.validateLocation(recording)))
            isValid = false;

        // Die Schaltflächen werden gemäß dem aktuellen Formularstand frei geschaltet
        RecordingEditor.cloneButton().button('option', 'disabled', this.identifier == null);
        RecordingEditor.saveAndCloneButton().button('option', 'disabled', !isValid);
        RecordingEditor.saveAndNewButton().button('option', 'disabled', !isValid);
        RecordingEditor.saveButton().button('option', 'disabled', !isValid);

        return isValid;
    };
    return RecordingEditor;
})();



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
        this.disallowQuery = 0;
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
        this.disallowQuery += 1;
        try  {
            this.languageController.model.val(null);
            this.seriesController.model.val(null);
            this.textController.model.val(null);
            this.rentController.model.val(null);
            this.genreController.model.val([]);
            this.page.val(0);
        } finally {
            this.disallowQuery -= 1;
        }

        if (query)
            this.query();
    };

    // Führt eine Suche mit der aktuellen Einschränkung aus
    RecordingFilter.prototype.query = function (resetPage) {
        var _this = this;
        if (typeof resetPage === "undefined") { resetPage = false; }
        if (resetPage) {
            this.disallowQuery += 1;
            try  {
                this.page.val(0);
            } finally {
                this.disallowQuery -= 1;
            }
        }

        if (this.disallowQuery > 0)
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
// Der Dialog zum Pflegen der Serien
var SeriesEditor = (function () {
    function SeriesEditor(openButtonSelector, reloadApplicationData, getChildren) {
        var _this = this;
        this.seriesIdentifier = null;
        this.reload = reloadApplicationData;
        this.getChildren = getChildren;

        $(openButtonSelector).click(function () {
            return _this.open();
        });

        this.dialogContent = this.dialog().html();
        this.dialog().empty();
    }
    SeriesEditor.prototype.open = function () {
        var _this = this;
        this.dialog().html(this.dialogContent);

        $('.navigationButton, .editButton').button();

        Tools.fillSeriesSelection(this.chooser(), this.series, '(Neue Serie anlegen)');
        Tools.fillSeriesSelection(this.parentChooser(), this.series, '(Keine)');

        this.confirmedDelete = new DeleteButton(this.dialog().find('.dialogDelete'), function () {
            return _this.remove();
        });

        this.saveButton().click(function () {
            return _this.save();
        });
        this.cancelButton().click(function () {
            return _this.close();
        });

        this.descriptionField().on('change', function () {
            return _this.validate();
        });
        this.descriptionField().on('input', function () {
            return _this.validate();
        });
        this.nameField().on('change', function () {
            return _this.validate();
        });
        this.nameField().on('input', function () {
            return _this.validate();
        });
        this.parentChooser().change(function () {
            return _this.validate();
        });
        this.chooser().change(function () {
            return _this.choose();
        });

        this.chooser().val('');
        this.choose();

        Tools.openDialog(this.dialog());
    };

    SeriesEditor.prototype.close = function () {
        this.dialog().dialog('close');
        this.dialog().empty();
    };

    SeriesEditor.prototype.restart = function () {
        this.close();

        // Wichtig ist, dass wir die neuen Listen in die Oberfläche laden
        this.reload();
    };

    SeriesEditor.prototype.createUpdate = function () {
        var newData = {
            parentId: this.parentChooser().val(),
            name: (this.nameField().val() || '').trim(),
            description: (this.descriptionField().val() || '').trim()
        };

        return newData;
    };

    SeriesEditor.prototype.reset = function (list) {
        this.series = list;
    };

    SeriesEditor.prototype.validate = function (newData) {
        if (typeof newData === "undefined") { newData = null; }
        if (newData == null)
            newData = this.createUpdate();

        var isValid = true;

        if (Tools.setError(this.nameField(), this.validateName(newData)))
            isValid = false;
        if (Tools.setError(this.descriptionField(), this.validateDescription(newData)))
            isValid = false;

        this.saveButton().button('option', 'disabled', !isValid);

        return isValid;
    };

    SeriesEditor.prototype.choose = function () {
        var _this = this;
        // Die aktuelle Auswahl ermitteln
        var choosen = this.chooser().val();

        // Und dann ganz defensiv erst einmal alles zurück setzen
        this.saveButton().button('option', 'disabled', choosen.length > 0);
        this.confirmedDelete.disable();

        this.parentChooser().val('');
        this.nameField().val('');
        this.descriptionField().val('');

        if (choosen.length < 1) {
            // Einfach ist es, wenn wir etwas neu Anlegen
            this.seriesIdentifier = '';

            this.validate();
        } else {
            // Ansonsten fragen wir den Web Service immer nach dem neuesten Stand
            this.seriesIdentifier = null;

            $.ajax('movie/series/' + choosen).done(function (info) {
                if (info == null)
                    return;

                _this.seriesIdentifier = info.id;

                _this.nameField().val(info.name);
                _this.descriptionField().val(info.description);
                _this.parentChooser().val(info.parentId);

                if (info.unused)
                    _this.confirmedDelete.enable();

                // Für den unwahrscheinlichen Fall, dass sich die Spielregeln verändert haben - und um die Schaltfläche zum Speichern zu aktivieren
                _this.validate();
            });
        }
    };

    SeriesEditor.prototype.remove = function () {
        var _this = this;
        if (this.seriesIdentifier == null)
            return;
        if (this.seriesIdentifier.length < 1)
            return;

        $.ajax('movie/series/' + this.seriesIdentifier, {
            type: 'DELETE'
        }).done(function () {
            return _this.restart();
        }).fail(function () {
            // Bei der Fehlerbehandlung ist noch Potential
            alert('Da ist leider etwas schief gegangen');
        });
    };

    SeriesEditor.prototype.save = function () {
        var _this = this;
        if (this.seriesIdentifier == null)
            return;

        var newData = this.createUpdate();

        // Vorsichtshalbe schauen wir noch einmal nach, ob das alles so in Ordnung geht
        if (!this.validate(newData))
            return;

        var url = 'movie/series';
        var series = this.seriesIdentifier;
        if (series.length > 0)
            url += '/' + series;

        $.ajax(url, {
            type: (series.length < 1) ? 'POST' : 'PUT',
            contentType: 'application/json; charset=utf-8',
            data: JSON.stringify(newData)
        }).done(function () {
            return _this.restart();
        }).fail(function () {
            // Bei der Fehlerbehandlung ist noch Potential
            alert('Da ist leider etwas schief gegangen');
        });
    };

    // Alles was jetzt kommt sind eigentlich die abstrakten Methoden der Basisklasse
    SeriesEditor.prototype.dialog = function () {
        return $('#seriesEditDialog');
    };

    SeriesEditor.prototype.chooser = function () {
        return this.dialog().find('.selectKey');
    };

    SeriesEditor.prototype.parentChooser = function () {
        return this.dialog().find('.editParent');
    };

    SeriesEditor.prototype.saveButton = function () {
        return this.dialog().find('.dialogSave');
    };

    SeriesEditor.prototype.cancelButton = function () {
        return this.dialog().find('.dialogCancel');
    };

    SeriesEditor.prototype.nameField = function () {
        return this.dialog().find('.editKey');
    };

    SeriesEditor.prototype.descriptionField = function () {
        return this.dialog().find('.editName');
    };

    SeriesEditor.prototype.validateName = function (newData) {
        var name = newData.name;

        if (name.length < 1)
            return 'Es muss ein Name angegeben werden';
        else if (name.length > 50)
            return 'Der Name darf maximal 50 Zeichen haben';
        else {
            var existingChildren = this.getChildren(newData.parentId);

            for (var i = 0; i < existingChildren.length; i++)
                if (existingChildren[i].name == name)
                    if (existingChildren[i].id != this.seriesIdentifier)
                        return 'Dieser Name wird bereits verwendet';

            return null;
        }
    };

    SeriesEditor.prototype.validateDescription = function (newData) {
        var description = newData.description;

        if (description.length > 2000)
            return 'Die Beschreibung darf maximal 2000 Zeichen haben';
        else
            return null;
    };
    return SeriesEditor;
})();
// Das Freitextfeld ist wirklich nur ein Textfeld, allerdings mit einer zeitgesteuerten automatischen Suche
var TextFilterController = (function () {
    function TextFilterController(view) {
        var _this = this;
        this.view = view;
        this.model = new Model(null);
        this.elapsed = function () {
        };
        // Gesetzt, wenn die automatische Suche nach der Eingabe eines Suchtextes aktiviert ist
        this.timeout = null;
        this.view.on('keypress', function () {
            return _this.viewToModel();
        });
        this.view.on('change', function () {
            return _this.viewToModel();
        });
        this.view.on('input', function () {
            return _this.viewToModel();
        });

        this.model.change(function () {
            return _this.modelToView();
        });

        this.modelToView();
    }
    TextFilterController.prototype.viewToModel = function () {
        var _this = this;
        this.stop();

        this.model.val(this.view.val());

        this.timeout = window.setTimeout(function () {
            return _this.elapsed();
        }, 300);
    };

    // Asynchrone automatische Suche deaktivieren
    TextFilterController.prototype.stop = function () {
        if (this.timeout != null)
            window.clearTimeout(this.timeout);

        this.timeout = null;
    };

    TextFilterController.prototype.modelToView = function () {
        var text = this.model.val();

        if (text !== this.view.val())
            this.view.val(text);
    };
    return TextFilterController;
})();

// Die Auswahl des Verleihers wird über drei separate Optionsfelder realisiert
var RentFilterController = (function () {
    function RentFilterController(view) {
        var _this = this;
        this.view = view;
        this.model = new Model(null);
        this.view.accordion(Styles.accordionSettings).find('input').button().change(function () {
            return _this.viewToModel();
        });

        this.model.change(function () {
            return _this.modelToView();
        });

        this.modelToView();
    }
    RentFilterController.prototype.viewToModel = function () {
        var choice = this.view.find(':checked').val();
        if (choice.length < 1)
            this.model.val(null);
        else
            this.model.val(choice == '1');
    };

    RentFilterController.prototype.modelToView = function () {
        var val = this.model.val();
        var value = (val == null) ? '' : (val ? '1' : '0');

        this.view.find('input[value="' + value + '"]').prop('checked', true);
        this.view.find('input').button('refresh');

        if (val == null)
            this.view.find('.ui-accordion-header>span').text('(egal)');
        else
            this.view.find('.ui-accordion-header>span').text(val ? 'nur verliehene' : 'nur nicht verliehene');
    };
    return RentFilterController;
})();

// Beschreibt die Auswahl aus eine Liste von Alternativen
var RadioGroupController = (function () {
    function RadioGroupController(groupView, groupName) {
        var _this = this;
        this.groupView = groupView;
        this.groupName = groupName;
        this.model = new Model(null);
        this.radios = {};
        this.groupView.change(function () {
            return _this.viewToModel();
        });

        this.model.change(function () {
            return _this.modelToView();
        });
    }
    RadioGroupController.prototype.viewToModel = function () {
        this.model.val(this.val());
    };

    RadioGroupController.prototype.modelToView = function () {
        this.val(this.model.val());
    };

    RadioGroupController.prototype.initialize = function (models) {
        this.fillView(this.groupView, models);
    };

    RadioGroupController.prototype.fillView = function (view, models) {
        var _this = this;
        view.empty();

        this.radios = {};
        this.radios[''] = new RadioView({ id: '', name: '(egal)' }, view, this.groupName);

        $.each(models, function (index, model) {
            return _this.radios[model.id] = new RadioView(model, view, _this.groupName);
        });

        this.val(null);
    };

    RadioGroupController.prototype.setCounts = function (statistics) {
        var _this = this;
        $.each(this.radios, function (key, stat) {
            return stat.reset();
        });
        $.each(statistics, function (index, stat) {
            return _this.radios[stat.id].setCount(stat.count);
        });
    };

    RadioGroupController.prototype.getName = function (id) {
        var radio = this.radios[id || ''];
        if (radio == null)
            return null;
        else
            return radio.model.name;
    };

    RadioGroupController.prototype.val = function (id) {
        if (typeof id === "undefined") { id = undefined; }
        if (id !== undefined) {
            var radio = this.radios[id || ''];
            if (radio != null)
                radio.check();
        }

        return this.groupView.find(':checked').val();
    };
    return RadioGroupController;
})();

// Beschreibt eine Mehrfachauswahl
var CheckGroupController = (function () {
    function CheckGroupController(groupView, groupName) {
        var _this = this;
        this.groupView = groupView;
        this.groupName = groupName;
        this.model = new Model([]);
        this.checks = {};
        this.model.change(function () {
            return _this.modelToView();
        });
    }
    CheckGroupController.prototype.initialize = function (models) {
        this.fillView(this.groupView, models);
    };

    CheckGroupController.prototype.fillView = function (view, models) {
        var _this = this;
        view.empty();

        this.checks = {};

        $.each(models, function (index, model) {
            return _this.checks[model.id] = new CheckView(model, view, function () {
                return _this.viewToModel();
            }, _this.groupName);
        });
    };

    CheckGroupController.prototype.setCounts = function (statistics) {
        var _this = this;
        $.each(this.checks, function (key, check) {
            return check.reset();
        });
        $.each(statistics, function (index, check) {
            return _this.checks[check.id].setCount(check.count);
        });
    };

    CheckGroupController.prototype.getName = function (genre) {
        var check = this.checks[genre];
        if (check == null)
            return null;
        else
            return check.model.name;
    };

    CheckGroupController.prototype.viewToModel = function () {
        this.model.val(this.val());
    };

    CheckGroupController.prototype.modelToView = function () {
        this.val(this.model.val());
    };

    CheckGroupController.prototype.val = function (ids) {
        if (typeof ids === "undefined") { ids = undefined; }
        if (ids !== undefined) {
            var newValue = {};

            $.each(ids, function (index, id) {
                return newValue[id] = true;
            });

            for (var id in this.checks) {
                var check = this.checks[id];

                check.check(newValue[check.model.id] || false);
            }
        }

        var selected = [];

        for (var id in this.checks) {
            var check = this.checks[id];

            if (check.isChecked())
                selected.push(check.model.id);
        }

        return selected;
    };
    return CheckGroupController;
})();

// Die Auswahl der Sprache erfolgt durch eine Reihe von Alternativen
var LanguageFilterController = (function (_super) {
    __extends(LanguageFilterController, _super);
    function LanguageFilterController(view) {
        _super.call(this, view, 'languageChoice');
        this.view = view;

        this.view.accordion(Styles.accordionSettings);

        this.modelToView();
    }
    LanguageFilterController.prototype.modelToView = function () {
        _super.prototype.modelToView.call(this);

        this.view.find('.ui-accordion-header>span').text(this.getName(this.model.val()) || '(egal)');
    };

    LanguageFilterController.prototype.initialize = function (models) {
        this.fillView(this.groupView.find('.ui-accordion-content'), models);
    };
    return LanguageFilterController;
})(RadioGroupController);

// Bei den Kategorien ist im Filter eine Mehrfachauswahl möglich
var GenreFilterController = (function (_super) {
    __extends(GenreFilterController, _super);
    function GenreFilterController(view) {
        _super.call(this, view, 'genreCheckbox');
        this.view = view;

        this.view.accordion(Styles.accordionSettings);

        this.modelToView();
    }
    GenreFilterController.prototype.modelToView = function () {
        var _this = this;
        _super.prototype.modelToView.call(this);

        var genres = this.model.val();

        if (genres.length < 1)
            this.view.find('.ui-accordion-header>span').text('(egal)');
        else
            this.view.find('.ui-accordion-header>span').text($.map(genres, function (genre) {
                return _this.getName(genre);
            }).join(' und '));
    };

    GenreFilterController.prototype.initialize = function (models) {
        this.fillView(this.groupView.find('.ui-accordion-content'), models);
    };
    return GenreFilterController;
})(CheckGroupController);

// Serien werden über einen Baum ausgewählt
var SeriesFilterController = (function () {
    function SeriesFilterController(view) {
        var _this = this;
        this.view = view;
        this.model = new Model(null);
        this.nextReset = 0;
        this.nodes = [];
        // Wird wärend der Änderung der Auswahl gesetzt
        this.selecting = false;
        this.view.accordion(Styles.accordionSettings).on('accordionactivate', function (event, ui) {
            if (ui.newPanel.length > 0)
                _this.activate();
        });

        this.container = this.view.find('.ui-accordion-content');
        this.container.keypress(function (ev) {
            return _this.onKeyPressed(ev);
        });
        this.model.change(function () {
            return _this.modelToView();
        });

        this.modelToView();
    }
    SeriesFilterController.prototype.modelToView = function () {
        var selected = this.model.val();
        var name = '(egal)';

        $.each(this.nodes, function (index, node) {
            return node.foreach(function (target) {
                if (target.model.selected.val(target.model.id == selected))
                    name = target.model.fullName;
            }, null);
        });

        this.view.find('.ui-accordion-header>span').text(name);
    };

    // Ein Tastendruck führt im allgemeinen dazu, dass sich die Liste auf den ersten Eintrag mit einem passenden Namen verschiebt
    SeriesFilterController.prototype.onKeyPressed = function (ev) {
        // Tasten innerhalb eines Zeitraums von einer Sekunde werden zu einem zu vergleichenden Gesamtpräfix zusammengefasst
        var now = $.now();
        if (now >= this.nextReset)
            this.search = '';

        this.search = (this.search + ev.char).toLowerCase();
        this.nextReset = now + 1000;

        for (var i = 0; i < this.nodes.length; i++) {
            var node = this.nodes[i];
            var name = node.model.fullName;

            // Der Vergleich ist wirklich etwas faul und dient wirklich nur zum grob anspringen
            if (name.length >= this.search.length)
                if (name.substr(0, this.search.length).toLowerCase() == this.search) {
                    this.scrollTo(node, []);

                    ev.preventDefault();

                    return;
                }
        }
    };

    // Wenn das jQuery UI Accordion geöffnet wirde, müssen wir irgendwie einen sinnvollen Anfangszustand herstellen
    SeriesFilterController.prototype.activate = function () {
        var _this = this;
        this.container.focus();
        this.nextReset = 0;

        // Stellt sicher, dass die aktuell ausgewählte Serie ganz oben angezeigt wird
        $.each(this.nodes, function (index, node) {
            return node.foreach(function (target, path) {
                if (target.model.selected.val())
                    _this.scrollTo(target, path);
            }, null);
        });
    };

    // Stellt sicher, dass eine beliebige Serie ganz oben dargestellt wird
    SeriesFilterController.prototype.scrollTo = function (selected, path) {
        // Wir klappen den Baum immer bis zur Auswahl auf
        $.each(path, function (index, node) {
            return node.nodeModel.expanded.val(true);
        });

        // Und dann verschieben wir das Sichtfenster so, dass die ausgewählte Serie ganz oben steht - ja, das kann man sicher eleganter machen
        if (path.length > 0)
            selected = path[0];

        var firstTop = this.container.children().first().offset().top;
        var selectedTop = selected.view.text.offset().top;

        this.container.scrollTop(selectedTop - firstTop);
    };

    // Hebt die aktuelle Auswahl auf
    SeriesFilterController.prototype.resetFilter = function (allbut) {
        if (typeof allbut === "undefined") { allbut = null; }
        $.each(this.nodes, function (index, node) {
            return node.foreach(function (target, path) {
                return target.model.selected.val(false);
            }, allbut);
        });
    };

    // Baut die Hierarchie der Serien auf
    SeriesFilterController.prototype.initialize = function (series) {
        var _this = this;
        this.container.empty();

        this.nodes = SeriesFilterController.buildTree(series.filter(function (s) {
            return s.parentId == null;
        }), this.container);

        $.each(this.nodes, function (index, node) {
            return node.click(function (target) {
                return _this.itemClick(target);
            });
        });
    };

    // Wird immer dann ausgelöst, wenn ein Knoten oder Blatt angeklick wurde
    SeriesFilterController.prototype.itemClick = function (target) {
        if (this.selecting)
            return;

        this.selecting = true;
        try  {
            // In der aktuellen Implementierung darf immer nur eine einzige Serie ausgewählt werden
            this.resetFilter(target);

            var model = target.model;
            if (model.selected.val())
                this.model.val(model.id);
            else
                this.model.val(null);
        } finally {
            this.selecting = false;
        }
    };

    // Baut ausgehend von einer Liste von Geschwisterserien den gesamten Baum unterhalb dieser Serien auf
    SeriesFilterController.buildTree = function (children, parent) {
        var _this = this;
        return $.map(children, function (item) {
            // Blätter sind einfach
            if (item.children.length < 1)
                return new TreeLeafController(new TreeLeafModel(item), new TreeLeafView(item.name, item.parentId == null, parent));

            // Bei Knoten müssen wir etwas mehr tun
            var node = new TreeNodeController(new TreeNodeModel(item), new TreeNodeView(item.name, item.parentId == null, parent));

            // Für alle untergeordeneten Serien müssen wir eine entsprechende Anzeige vorbereiten
            node.children = _this.buildTree(item.children, node.nodeView.childView);

            return node;
        });
    };
    return SeriesFilterController;
})();

// Die Steuerung der Hierarchien
var TreeController = (function () {
    function TreeController(model, view) {
        this.model = model;
        this.view = view;
        this.selected = function (target) {
        };
    }
    TreeController.prototype.click = function (callback) {
        this.selected = callback;
    };

    TreeController.prototype.foreach = function (callback, allbut, path) {
        if (typeof path === "undefined") { path = []; }
        if (allbut !== this)
            callback(this, path);
    };
    return TreeController;
})();

var TreeNodeController = (function (_super) {
    __extends(TreeNodeController, _super);
    function TreeNodeController(nodeModel, nodeView) {
        var _this = this;
        _super.call(this, nodeModel, nodeView);
        this.nodeModel = nodeModel;
        this.nodeView = nodeView;
        this.children = [];

        this.nodeView.toggle = function () {
            return _this.nodeModel.expanded.val(!_this.nodeModel.expanded.val());
        };
        this.view.click = function () {
            return _this.nodeModel.selected.val(!_this.nodeModel.selected.val());
        };
        this.nodeModel.expanded.change(function () {
            return _this.modelExpanded();
        });
        this.nodeModel.selected.change(function () {
            return _this.modelSelected();
        });

        this.modelExpanded();
    }
    TreeNodeController.prototype.modelExpanded = function () {
        this.nodeView.expanded(this.nodeModel.expanded.val());
    };

    TreeNodeController.prototype.modelSelected = function () {
        this.view.selected(this.nodeModel.selected.val());
        this.selected(this);
    };

    TreeNodeController.prototype.click = function (callback) {
        _super.prototype.click.call(this, callback);

        $.each(this.children, function (index, child) {
            return child.click(callback);
        });
    };

    TreeNodeController.prototype.foreach = function (callback, allbut, path) {
        if (typeof path === "undefined") { path = []; }
        _super.prototype.foreach.call(this, callback, allbut);

        path.push(this);

        $.each(this.children, function (index, child) {
            return child.foreach(callback, allbut, path);
        });

        path.pop();
    };
    return TreeNodeController;
})(TreeController);

var TreeLeafController = (function (_super) {
    __extends(TreeLeafController, _super);
    function TreeLeafController(leafModel, leafView) {
        var _this = this;
        _super.call(this, leafModel, leafView);
        this.leafModel = leafModel;
        this.leafView = leafView;

        this.view.click = function () {
            return _this.leafModel.selected.val(!_this.leafModel.selected.val());
        };
        this.leafModel.selected.change(function () {
            return _this.modelSelected();
        });
    }
    TreeLeafController.prototype.modelSelected = function () {
        this.view.selected(this.leafModel.selected.val());
        this.selected(this);
    };
    return TreeLeafController;
})(TreeController);
// Ein einzelne Option einer Alternativauswahl
var RadioView = (function () {
    function RadioView(model, container, optionGroupName) {
        this.model = model;
        var id = optionGroupName + this.model.id;

        this.radio = $('<input />', { type: 'radio', id: id, name: optionGroupName, value: this.model.id }).appendTo(container);
        this.label = $('<label />', { 'for': id, text: this.model.name }).appendTo(container);

        this.radio.button();
    }
    RadioView.prototype.reset = function () {
        if (this.model.id.length < 1)
            return;

        if (this.radio.prop('checked')) {
            this.label.removeClass(Styles.invisble);
            this.radio.removeClass(Styles.invisble);
        } else {
            this.label.addClass(Styles.invisble);
            this.radio.addClass(Styles.invisble);
        }
    };

    RadioView.prototype.check = function () {
        this.radio.prop('checked', true).button('refresh');
    };

    RadioView.prototype.setCount = function (count) {
        this.radio.button('option', 'label', this.model.name + ' (' + count + ')');

        this.radio.removeClass(Styles.invisble);
        this.label.removeClass(Styles.invisble);
    };
    return RadioView;
})();

// Eine einzelne Option einer Mehrfachauswahl
var CheckView = (function () {
    function CheckView(model, container, onChange, groupName) {
        this.model = model;
        var id = groupName + this.model.id;

        this.checkbox = $('<input />', { type: 'checkbox', id: id, name: this.model.id }).appendTo(container).change(onChange);
        this.label = $('<label />', { 'for': id, text: this.model.name }).appendTo(container);

        this.checkbox.button();
    }
    CheckView.prototype.reset = function () {
        if (this.checkbox.prop('checked')) {
            this.label.removeClass(Styles.invisble);
            this.checkbox.removeClass(Styles.invisble);
        } else {
            this.label.addClass(Styles.invisble);
            this.checkbox.addClass(Styles.invisble);
        }
    };

    CheckView.prototype.isChecked = function () {
        return this.checkbox.prop('checked');
    };

    CheckView.prototype.check = function (check) {
        this.checkbox.prop('checked', check).button('refresh');
    };

    CheckView.prototype.setCount = function (count) {
        this.checkbox.button('option', 'label', this.model.name + ' (' + count + ')');

        this.checkbox.removeClass(Styles.invisble);
        this.label.removeClass(Styles.invisble);
    };
    return CheckView;
})();

// Jedes Element in einem Baum wird durch einen Text in einem Oberflächenelement repräsentiert
var TreeItemView = (function () {
    function TreeItemView(container, isRoot) {
        // Wird ausgelöst, wenn der Name angeklickt wird
        this.click = function () {
        };
        this.view = $('<div />').appendTo(container);

        if (!isRoot)
            this.view.addClass(Styles.treeNode);
    }
    // Gemeinsam ist allen Elementen auch, dass sie ausgewählt werden können und dies durch ein optisches Feedback anzeigen
    TreeItemView.prototype.selected = function (isSelected) {
        if (isSelected)
            this.text.addClass(Styles.selectedNode);
        else
            this.text.removeClass(Styles.selectedNode);
    };

    // Legt den Anzeigenamen fest
    TreeItemView.prototype.setText = function (name, view) {
        var _this = this;
        this.text = view.addClass(Styles.treeItem).text(name).click(function () {
            return _this.click();
        });
    };
    return TreeItemView;
})();

// Ein Blatt zeigt im wesentlichen nur seinen Namen an
var TreeLeafView = (function (_super) {
    __extends(TreeLeafView, _super);
    function TreeLeafView(name, isRoot, container) {
        _super.call(this, container, isRoot);

        this.setText(name, this.view);
    }
    return TreeLeafView;
})(TreeItemView);

// Ein Knoten hat zusätzlich einen Bereich für Kindknoten, der zudem auf- und zugeklappt werden kann
var TreeNodeView = (function (_super) {
    __extends(TreeNodeView, _super);
    function TreeNodeView(name, isRoot, container) {
        var _this = this;
        _super.call(this, container, isRoot);
        this.toggle = function () {
        };

        // Der Kopfbereich wird das Klappsymbol und den Namen enthalten
        var header = $('<div />', { 'class': Styles.nodeHeader }).appendTo(this.view);

        $('<div />', { 'class': 'ui-icon' }).click(function () {
            return _this.toggle();
        }).appendTo(header);

        this.setText(name, $('<div />').appendTo(header));

        // Der Kindbereich bleibt erst einmal leer
        this.childView = $('<div />').appendTo(this.view);
    }
    // Zeigt oder verbirgt die Unterstruktur
    TreeNodeView.prototype.expanded = function (isExpanded) {
        var toggle = this.view.children().first().children().first();

        if (isExpanded) {
            toggle.removeClass(Styles.collapsed).addClass(Styles.expanded);

            this.childView.removeClass(Styles.invisble);
        } else {
            toggle.removeClass(Styles.expanded).addClass(Styles.collapsed);

            this.childView.addClass(Styles.invisble);
        }
    };
    return TreeNodeView;
})(TreeItemView);
//# sourceMappingURL=code.js.map

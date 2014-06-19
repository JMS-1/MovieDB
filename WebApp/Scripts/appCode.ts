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

module MovieDatabase {

    interface IApplicationInformation extends IApplicationInformationContract {
        series: ISeriesMapping[];
    };

    class DateTimeTools {
        private static toNumber(val: number): string {
            if (val < 10)
                return '0' + val.toString();
            else
                return val.toString();
        }

        static toStandard(dateTime: Date): string {
            return DateTimeTools.toNumber(dateTime.getDate()) + '.' +
                DateTimeTools.toNumber(1 + dateTime.getMonth()) + '.' +
                dateTime.getFullYear().toString() + ' ' +
                DateTimeTools.toNumber(dateTime.getHours()) + ':' +
                DateTimeTools.toNumber(dateTime.getMinutes()) + ':' +
                DateTimeTools.toNumber(dateTime.getSeconds());
        }
    }

    class Application {
        constructor() {
            $(() => this.startup());
        }

        static Current: Application = new Application();

        private recordingFilter: RecordingFilter;

        private currentApplicationInformation: IApplicationInformation;

        private currentRecording: RecordingEditor;

        private genreEditor: MultiValueEditor<IGenreContract>;

        private languageEditor: MultiValueEditor<ILanguageContract>;

        private genreDialog: GenreEditor;

        private languageDialog: LanguageEditor;

        private seriesDialog: SeriesEditor;

        private containerDialog: ContainerEditor;

        private allSeries: any = {};

        private allGenres: any = {};

        private allLanguages: any = {};

        private migrate(): void {
            var legacyFile = $('#theFile');

            var fileInput = <HTMLInputElement>(legacyFile[0]);
            if (fileInput.files.length != 1)
                return;

            var data = new FormData();
            data.append('legacyFile', fileInput.files[0]);

            var request: JQueryAjaxSettings = {
                contentType: false,
                processData: false,
                type: 'POST',
                data: data,
            };

            $.ajax('movie/db/initialize', request).done(() => this.refresh());
        }

        private refresh(): void {
            this.requestApplicationInformation().done(info => this.fillApplicationInformation(info));
        }

        private buildSeriesMapping(): void {
            this.allSeries = {};

            $.each(this.currentApplicationInformation.series, (index, mapping) => {
                mapping.children = [];

                this.allSeries[mapping.id] = mapping;
            });

            $.each(this.currentApplicationInformation.series, (index, mapping) => {
                if (mapping.parentId == null)
                    return;

                var parent: ISeriesMapping = this.allSeries[mapping.parentId];

                parent.children.push(mapping);
            });
        }

        private fillApplicationInformation(info: IApplicationInformation): void {
            var busyIndicator = $('#busyIndicator');

            busyIndicator.removeClass(Styles.loading);
            busyIndicator.addClass(Styles.idle);

            this.allGenres = {};
            this.allLanguages = {};

            $.each(info.genres, (index, genre) => this.allGenres[genre.id] = genre.name);
            $.each(info.languages, (index, language) => this.allLanguages[language.id] = language.name);

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
        }

        /*
          Hier werden die Rohdaten einer Suche nach Aufzeichnungen erst einmal angereichert
          und dann als Tabellenzeilen in die Oberfläche übernommen.
        */
        private fillResultTable(results: ISearchInformation): void {
            var pageSizeCount = $('#pageSizeCount');
            var pageButtons = $('#pageButtons');
            if (results.total < results.size) {
                pageSizeCount.text('');

                pageButtons.addClass(Styles.invisble);
            }
            else {
                pageSizeCount.text(' von ' + results.total);

                pageButtons.removeClass(Styles.invisble);
                pageButtons.empty();

                var pagesShown = 20;
                var numberOfPages = Math.floor((results.total + results.size - 1) / results.size);
                var firstIndex = Math.max(0, results.page - 2);
                var lastIndex = Math.min(numberOfPages - 1, firstIndex + pagesShown - 1);

                // Sieht ein bißchen komisch aus aber wir wollen zum Aufruf des Lambdas ein Closure auf die Schleifenkontrollvariable erzeugen
                for (var index = firstIndex; index <= lastIndex; index++)
                    ((capturedIndex: number) => {
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
                            anchor.click(() => {
                                this.recordingFilter.page = capturedIndex;

                                this.recordingFilter.query();
                            });
                    })(index);
            }

            // Trefferanzahl für die einzelnen Aufzeichnungsarten einblenden
            this.recordingFilter.setLanguageCounts(results.languages);
            this.recordingFilter.setGenreCounts(results.genres);

            var tableBody = $('#recordingTable>tbody');

            tableBody.empty();

            $.each(results.recordings, (index, recording) => {
                if (recording.series == null)
                    recording.hierarchicalName = recording.title;
                else {
                    var series: ISeriesMapping = this.allSeries[recording.series];

                    recording.hierarchicalName = series.hierarchicalName + ' ' + this.currentApplicationInformation.seriesSeparator + ' ' + recording.title;
                }

                var recordingRow = $('<tr></tr>').appendTo(tableBody);

                $('<a />', { text: recording.hierarchicalName, href: '#' + recording.id }).appendTo($('<td />').appendTo(recordingRow));
                $('<td />').appendTo(recordingRow).text($.map(recording.languages, language => this.allLanguages[language] || language).join('; '));
                $('<td />').appendTo(recordingRow).text($.map(recording.genres, genre=> this.allGenres[genre] || genre).join('; '));
                $('<td />').appendTo(recordingRow).text(DateTimeTools.toStandard(recording.created));
                $('<td />').appendTo(recordingRow).text(recording.rent);
            });

            this.setMode();
        }

        private requestApplicationInformation(): JQueryPromise<IApplicationInformation> {
            return $.ajax('movie/info').done((info: IApplicationInformation) => this.fillApplicationInformation(info));
        }

        private resetAllModes(): void {
            $('.operationMode').addClass(Styles.invisble);
        }

        private setMode(): void {
            this.resetAllModes();

            var hash: string = window.location.hash;
            if (hash.length < 2)
                $('#queryMode').removeClass(Styles.invisble);
            else
                $.ajax('movie/db/' + hash.substring(1)).done(recording => this.fillEditForm(recording));
        }

        private fillEditForm(recording: IRecordingEditContract): void {
            this.currentRecording = new RecordingEditor(recording, this.genreEditor, this.languageEditor);
        }

        private disableSort(indicator: JQuery): void {
            indicator.removeClass(Styles.sortedDown);
            indicator.removeClass(Styles.sortedUp);
            indicator.addClass(Styles.notSorted);
        }

        private enableSort(indicator: JQuery): boolean {
            var sortDown = indicator.hasClass(Styles.sortedUp);

            indicator.removeClass(Styles.notSorted);
            indicator.removeClass(sortDown ? Styles.sortedUp : Styles.sortedDown);
            indicator.addClass(sortDown ? Styles.sortedDown : Styles.sortedUp);

            return !sortDown;
        }

        private getChildren(series: string): ISeriesMappingContract[] {
            if ((series == null) || (series.length < 1)) {
                return this.currentApplicationInformation.series.filter(s => s.parentId == null);
            } else {
                var parent = <ISeriesMapping>this.allSeries[series];

                return parent.children;
            }
        }

        private backToQuery(): void {
            window.location.hash = '';

            this.recordingFilter.query();
        }

        private startup(): void {
            // Man beachte, dass alle der folgenden Benachrichtigungen immer an den aktuellen Änderungsvorgang koppeln, so dass keine Abmeldung notwendig ist
            var validateRecordingEditForm = () => this.currentRecording.validate();

            this.seriesDialog = new SeriesEditor('.openSeriesEditDialog', () => this.requestApplicationInformation(), series => this.getChildren(series));
            this.recordingFilter = new RecordingFilter(result => this.fillResultTable(result), series => this.allSeries[series]);
            this.containerDialog = new ContainerEditor('.openContainerEditDialog', () => this.requestApplicationInformation());
            this.languageEditor = new MultiValueEditor<ILanguageContract>('#recordingEditLanguage', validateRecordingEditForm);
            this.languageDialog = new LanguageEditor('.openLanguageEditDialog', () => this.requestApplicationInformation());
            this.genreEditor = new MultiValueEditor<IGenreContract>('#recordingEditGenre', validateRecordingEditForm);
            this.genreDialog = new GenreEditor('.openGenreEditDialog', () => this.requestApplicationInformation());

            var legacyFile = $('#theFile');
            var migrateButton = $('#migrate');

            legacyFile.change(() => this.migrate());
            migrateButton.button().click(() => legacyFile.click());

            var pageSize = $('#pageSize');
            pageSize.change(() => {
                this.recordingFilter.size = parseInt(pageSize.val());
                this.recordingFilter.page = 0;

                this.recordingFilter.query();
            });

            var sortName = $('#sortName')
            var sortDate = $('#sortDate');

            sortName.click(() => {
                this.disableSort(sortDate);

                this.recordingFilter.ascending = this.enableSort(sortName);
                this.recordingFilter.order = OrderSelector.title;

                this.recordingFilter.query();
            });

            sortDate.click(() => {
                this.disableSort(sortName);

                this.recordingFilter.ascending = this.enableSort(sortDate);
                this.recordingFilter.order = OrderSelector.created;

                this.recordingFilter.query();
            });

            $('#resetQuery').button().click(() => this.recordingFilter.reset(true));

            $('.navigationButton, .editButton').button();

            $('#gotoQuery').click(() => window.location.hash = '');

            RecordingEditor.saveButton().click(() => this.currentRecording.save(() => this.backToQuery()));
            RecordingEditor.titleField().on('change', validateRecordingEditForm);
            RecordingEditor.titleField().on('input', validateRecordingEditForm);
            RecordingEditor.descriptionField().on('change', validateRecordingEditForm);
            RecordingEditor.descriptionField().on('input', validateRecordingEditForm);
            RecordingEditor.rentField().on('change', validateRecordingEditForm);
            RecordingEditor.rentField().on('input', validateRecordingEditForm);
            RecordingEditor.locationField().on('change', validateRecordingEditForm);
            RecordingEditor.locationField().on('input', validateRecordingEditForm);

            // Allgemeine Informationen zur Anwendung abrufen - eventuell dauert das etwas, da die Datenbank gestartet werden muss
            this.requestApplicationInformation().done(info => {
                $('#headline').text('VCR.NET Mediendatenbank');

                // Wir benutzen ein wenige deep linking für einige Aufgaben
                $(window).on('hashchange', () => this.setMode());

                // Ab jetzt sind wir bereit
                $('#main').removeClass(Styles.invisble);
            });
        }
    }
} 
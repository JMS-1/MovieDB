/// <reference path='typings/jquery/jquery.d.ts' />
/// <reference path='typings/jqueryui/jqueryui.d.ts' />
/// <reference path='interfaces.ts' />
/// <reference path='uiHelper.ts' />
/// <reference path='recFilter.ts' />

module MovieDatabase {

    interface ISeriesMapping extends ISeriesMappingContract {
        children: ISeriesMapping[];
    }

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
            this.recordingFilter = new RecordingFilter();

            $(() => this.startup());
        }

        static Current: Application = new Application();

        private recordingFilter: RecordingFilter;

        private currentApplicationInformation: IApplicationInformation;

        private currentRecording: IRecordingEditContract;

        private allSeries: any = {}

        private genreMap: GenreSelectors;

        private languageMap: LanguageSelectors;

        private seriesMap: SeriesSelectors;

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

        private query(): void {
            var busyIndicator = $('#busyIndicator');

            busyIndicator.removeClass(Styles.idle);
            busyIndicator.addClass(Styles.busy);

            this.recordingFilter.send().done(results => {
                if (!results.ignore)
                    this.fillResultTable(results);
            });
        }

        private setLanguages(): void {
            this.recordingFilter.language = null;
            this.recordingFilter.page = 0;

            this.languageMap.initialize(this.currentApplicationInformation.languages);
        }

        private setSeries(): void {
            this.recordingFilter.series = [];
            this.recordingFilter.page = 0;

            this.seriesMap.initialize(this.currentApplicationInformation.series);
        }

        private setGenres(): void {
            this.genreMap.initialize(this.currentApplicationInformation.genres, () => this.genreChanged(true));
            this.genreChanged(false);
        }

        private genreChanged(query: boolean): void {
            this.recordingFilter.genres = [];
            this.recordingFilter.page = 0;

            this.genreMap.foreachSelected(checkbox => this.recordingFilter.genres.push(checkbox.attr('name')));

            var genreFilterHeader = $('#genreFilterHeader');
            if (this.recordingFilter.genres.length < 1)
                genreFilterHeader.text('(egal)');
            else
                genreFilterHeader.text(this.recordingFilter.genres.join(' und '));

            if (query)
                this.query();
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

            this.currentApplicationInformation = info;

            var migrateButton = $('#migrate');
            if (info.empty)
                migrateButton.removeClass(Styles.invisble);
            else
                migrateButton.addClass(Styles.invisble);

            $('#countInfo').text('(Es gibt ' + info.total + ' Aufzeichnung' + ((info.total == 1) ? '' : 'en') + ')');

            this.buildSeriesMapping();
            this.setLanguages();
            this.setGenres();
            this.setSeries();

            this.query();
        }

        /*
          Hier werden die Rohdaten einer Suche nach Aufzeichnungen erst einmal angereichert
          und dann als Tabellenzeilen in die Oberfläche übernommen.
        */
        private fillResultTable(results: ISearchInformation): void {
            var busyIndicator = $('#busyIndicator');

            busyIndicator.removeClass(Styles.busy);
            busyIndicator.addClass(Styles.idle);

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

                                this.query();
                            });
                    })(index);
            }

            // Trefferanzahl für die einzelnen Aufzeichnungsarten einblenden
            this.genreMap.setCount(results.genres);
            this.languageMap.setCount(results.languages);

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
                $('<td />').appendTo(recordingRow).text(recording.languages.join('; '));
                $('<td />').appendTo(recordingRow).text(recording.genres.join('; '));
                $('<td />').appendTo(recordingRow).text(DateTimeTools.toStandard(recording.created));
                $('<td />').appendTo(recordingRow).text(recording.rent);
            });

            this.setMode();
        }

        private requestApplicationInformation(): JQueryPromise<IApplicationInformation> {
            return $.ajax('movie/info');
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
            this.currentRecording = recording;

            $('#recordingTitle').val(recording.title);

            $('#editRecordingMode').removeClass(Styles.invisble);
        }

        private textChanged(): void {
            this.recordingFilter.text = $('#textSearch').val();
            this.recordingFilter.page = 0;
        }

        private applySeriesToFilter(series: string): void {
            if (series.length > 0)
                this.applySeriesToFilterRecursive(this.allSeries[series]);
        }

        private applySeriesToFilterRecursive(series: ISeriesMapping): void {
            this.recordingFilter.series.push(series.id);

            $.each(series.children, (index, child) => this.applySeriesToFilterRecursive(child));
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

        private startup(): void {
            this.genreMap = new GenreSelectors('#genreFilter');
            this.seriesMap = new SeriesSelectors('#seriesFilter');
            this.languageMap = new LanguageSelectors('#languageFilter');

            var legacyFile = $('#theFile');
            var migrateButton = $('#migrate');

            legacyFile.change(() => this.migrate());
            migrateButton.button().click(() => legacyFile.click());

            this.languageMap.container.change(() => {
                this.recordingFilter.language = this.languageMap.container.val();
                this.recordingFilter.page = 0;

                this.query();
            });

            this.seriesMap.container.change(() => {
                this.recordingFilter.series = [];
                this.recordingFilter.page = 0;

                this.applySeriesToFilter(this.seriesMap.container.val());

                this.query();
            });

            var pageSize = $('#pageSize');
            pageSize.change(() => {
                this.recordingFilter.size = parseInt(pageSize.val());
                this.recordingFilter.page = 0;

                this.query();
            });

            var textSearch = $('#textSearch');
            textSearch.on('change', () => this.textChanged());
            textSearch.on('input', () => this.textChanged());
            textSearch.on('keypress', (e: JQueryEventObject) => {
                if (e.which == 13)
                    this.query();
            });

            var rentChooser = $('#rentFilter');
            rentChooser.buttonset().click(() => {
                var choice: string = rentChooser.find(':checked').val();
                var newRent: boolean = null;

                if (choice.length > 0)
                    newRent = (choice == '1');
                if (this.recordingFilter.rent == newRent)
                    return;

                this.recordingFilter.rent = newRent;
                this.recordingFilter.page = 0;

                this.query();
            });

            var sortName = $('#sortName')
            var sortDate = $('#sortDate');

            sortName.click(() => {
                this.disableSort(sortDate);

                this.recordingFilter.ascending = this.enableSort(sortName);
                this.recordingFilter.order = OrderSelector.title;

                this.query();
            });

            sortDate.click(() => {
                this.disableSort(sortName);

                this.recordingFilter.ascending = this.enableSort(sortDate);
                this.recordingFilter.order = OrderSelector.created;

                this.query();
            });

            $('#resetQuery').button().click(() => {

                rentChooser.find(':checked').prop('checked', false);
                $('#anyRent').prop('checked', true);
                rentChooser.buttonset('refresh');

                this.languageMap.resetFilter();
                this.seriesMap.resetFilter();
                this.genreMap.resetFilter();
                this.genreChanged(false);
                textSearch.val(null);

                this.recordingFilter.language = null;
                this.recordingFilter.series = [];
                this.recordingFilter.genres = [];
                this.recordingFilter.rent = null;
                this.recordingFilter.text = null;
                this.recordingFilter.page = 0;

                this.query();
            });

            $('.navigationButton').button();

            $('#gotoQuery').click(() => window.location.hash = '');

            // Allgemeine Informationen zur Anwendung abrufen - eventuell dauert das etwas, da die Datenbank gestartet werden muss
            this.requestApplicationInformation().done(info => {
                $('#headline').text('VCR.NET Mediendatenbank');

                this.fillApplicationInformation(info);

                // Wir benutzen ein wenige deep linking für einige Aufgaben
                $(window).on('hashchange', () => this.setMode());

                // Ab jetzt sind wir bereit
                $('#main').removeClass(Styles.invisble);
            });
        }
    }
} 
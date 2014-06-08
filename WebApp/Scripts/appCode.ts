/// <reference path='typings/jquery/jquery.d.ts' />
/// <reference path='typings/jqueryui/jqueryui.d.ts' />
/// <reference path='interfaces.ts' />
/// <reference path='uiHelper.ts' />


module MovieDatabase {

    // Die angereichteren Schnittstellen

    interface ISeriesMapping extends ISeriesMappingContract {
        children: ISeriesMapping[];
    }

    interface IRecordingInfo extends IRecordingInfoContract {
        created: Date;

        hierarchicalName: string;
    }

    interface IApplicationInformation extends IApplicationInformationContract {
        series: ISeriesMapping[];
    };

    interface ISearchInformation extends ISearchInformationContract {
        recordings: IRecordingInfo[];

        ignore: boolean;
    }

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

    // Eine Suchanfrage
    class SearchRequest extends SearchRequestContract {

        private pending: number = 0;

        private static propertyFilter(propertyName: string, propertyValue: any): any {
            if (propertyName != 'pending')
                return propertyValue;

            return undefined;
        }

        send(): JQueryPromise<ISearchInformation> {

            // Jede Suche bekommt eine neue Nummer und es wird immer nur das letzte Ergebnis ausgewertet
            var thisRequest = ++this.pending;

            return $.ajax('movie/db', {
                contentType: 'application/json; charset=utf-8',
                data: JSON.stringify(this, SearchRequest.propertyFilter),
                dataType: 'json',
                type: 'POST',
            }).done((searchResult: ISearchInformation) => {

                    // Veraltete Ergebnisse überspringen wir einfach
                    searchResult.ignore = (this.pending != thisRequest);
                    if (searchResult.ignore)
                        return;

                    if (searchResult == null)
                        return;

                    var recordings = searchResult.recordings;
                    if (recordings == null)
                        return;

                    // Ein wenig Vorarbeit hübscht die Daten vom Web Service etwas auf: aus der Rohdarstellung des Datums machen wir ein Date Objekt
                    $.each(recordings, (index, recording) => recording.created = new Date(recording.createdAsString));
                });
        }

        static Current: SearchRequest = new SearchRequest();
    }

    // Repräsentiert die Anwendung als Ganzes
    class Application {
        constructor() {
            $(() => this.startup());
        }

        static Current: Application = new Application();

        private currentApplicationInformation: IApplicationInformation;

        private busyIndicator: JQuery;

        private legacyFile: JQuery;

        private migrateButton: JQuery;

        private genreFilterHeader: JQuery;

        private pageSize: JQuery;

        private pageSizeCount: JQuery;

        private textSearch: JQuery;

        private pageButtons: JQuery;

        private rentChooser: JQuery;

        private allSeries: any = {}

        private genreMap: GenreSelectors;

        private languageMap: LanguageSelectors;

        private seriesMap: SeriesSelectors;

        private migrate(): void {
            var fileInput = <HTMLInputElement>(this.legacyFile[0]);
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
            this.busyIndicator.removeClass(Styles.idle);
            this.busyIndicator.addClass(Styles.busy);

            SearchRequest.Current.send().done(results => {
                if (!results.ignore)
                    this.fillResultTable(results);
            });
        }

        private setLanguages(): void {
            SearchRequest.Current.language = null;
            SearchRequest.Current.page = 0;

            this.languageMap.initialize(this.currentApplicationInformation.languages);
        }

        private setSeries(): void {
            SearchRequest.Current.series = [];
            SearchRequest.Current.page = 0;

            this.seriesMap.initialize(this.currentApplicationInformation.series);
        }

        private setGenres(): void {
            this.genreMap.initialize(this.currentApplicationInformation.genres, () => this.genreChanged(true));
            this.genreChanged(false);
        }

        private genreChanged(query: boolean): void {
            SearchRequest.Current.genres = [];
            SearchRequest.Current.page = 0;

            this.genreMap.foreachSelected(checkbox => SearchRequest.Current.genres.push(checkbox.attr('name')));

            if (SearchRequest.Current.genres.length < 1)
                this.genreFilterHeader.text('(egal)');
            else
                this.genreFilterHeader.text(SearchRequest.Current.genres.join(' und '));

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
            this.busyIndicator.removeClass(Styles.loading);
            this.busyIndicator.addClass(Styles.idle);

            this.currentApplicationInformation = info;

            if (info.empty)
                this.migrateButton.removeClass(Styles.invisble);
            else
                this.migrateButton.addClass(Styles.invisble);

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
            this.busyIndicator.removeClass(Styles.busy);
            this.busyIndicator.addClass(Styles.idle);

            if (results.total < results.size) {
                this.pageSizeCount.text('');

                this.pageButtons.addClass(Styles.invisble);
            }
            else {
                this.pageSizeCount.text(' von ' + results.total);

                this.pageButtons.removeClass(Styles.invisble);
                this.pageButtons.empty();

                var pagesShown = 20;
                var numberOfPages = Math.floor((results.total + results.size - 1) / results.size);
                var firstIndex = Math.max(0, results.page - 2);
                var lastIndex = Math.min(numberOfPages - 1, firstIndex + pagesShown - 1);

                // Sieht ein bißchen komisch aus aber wir wollen zum Aufruf des Lambdas ein Closure auf die Schleifenkontrollvariable erzeugen
                for (var index = firstIndex; index <= lastIndex; index++)
                    ((capturedIndex: number) => {
                        var anchor = $('<a href="javascript:void(0)" class="' + Styles.pageButton + '" />').appendTo(this.pageButtons).button();

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
                                SearchRequest.Current.page = capturedIndex;

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

            this.setQueryMode();
        }

        private requestApplicationInformation(): JQueryPromise<IApplicationInformation> {
            return $.ajax('movie/info');
        }

        private resetAllModes(): void {
            $('.operationMode').addClass(Styles.invisble);
        }

        private setQueryMode(): void {
            this.resetAllModes();

            $('#queryMode').removeClass(Styles.invisble);
        }

        private textChanged(): void {
            SearchRequest.Current.text = this.textSearch.val();
            SearchRequest.Current.page = 0;
        }

        private applySeriesToFilter(series: string): void {
            if (series.length > 0)
                Application.applySeriesToFilter(this.allSeries[series]);
        }

        private static applySeriesToFilter(series: ISeriesMapping): void {
            SearchRequest.Current.series.push(series.id);

            $.each(series.children, (index, child) => Application.applySeriesToFilter(child));
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

            this.busyIndicator = $('#busyIndicator');

            this.legacyFile = $('#theFile');
            this.legacyFile.change(() => this.migrate());

            this.migrateButton = $('#migrate');
            this.migrateButton.button().click(() => this.legacyFile.click());

            this.languageMap.container.change(() => {
                SearchRequest.Current.language = this.languageMap.container.val();
                SearchRequest.Current.page = 0;

                this.query();
            });

            this.seriesMap.container.change(() => {
                SearchRequest.Current.series = [];
                SearchRequest.Current.page = 0;

                this.applySeriesToFilter(this.seriesMap.container.val());

                this.query();
            });

            this.genreFilterHeader = $('#genreFilterHeader');

            this.pageSize = $('#pageSize');
            this.pageSizeCount = $('#pageSizeCount');
            this.pageSize.change(() => {
                SearchRequest.Current.size = parseInt(this.pageSize.val());
                SearchRequest.Current.page = 0;

                this.query();
            });

            this.textSearch = $('#textSearch');
            this.textSearch.on('change', () => this.textChanged());
            this.textSearch.on('input', () => this.textChanged());
            this.textSearch.on('keypress', (e: JQueryEventObject) => {
                if (e.which == 13)
                    this.query();
            });

            this.rentChooser = $('#rentFilter');
            this.rentChooser.buttonset().click(() => {
                var choice: string = this.rentChooser.find(':checked').val();
                var newRent: boolean = null;

                if (choice.length > 0)
                    newRent = (choice == '1');
                if (SearchRequest.Current.rent == newRent)
                    return;

                SearchRequest.Current.rent = newRent;
                SearchRequest.Current.page = 0;

                this.query();
            });

            var sortName = $('#sortName')
            var sortDate = $('#sortDate');

            sortName.click(() => {
                this.disableSort(sortDate);

                SearchRequest.Current.ascending = this.enableSort(sortName);
                SearchRequest.Current.order = OrderSelector.title;

                this.query();
            });

            sortDate.click(() => {
                this.disableSort(sortName);

                SearchRequest.Current.ascending = this.enableSort(sortDate);
                SearchRequest.Current.order = OrderSelector.created;

                this.query();
            });

            this.pageButtons = $('#pageButtons');

            $('#resetQuery').button().click(() => {

                this.rentChooser.find(':checked').prop('checked', false);
                $('#anyRent').prop('checked', true);
                this.rentChooser.buttonset('refresh');

                this.languageMap.resetFilter();
                this.seriesMap.resetFilter();
                this.genreMap.resetFilter();
                this.textSearch.val(null);
                this.genreChanged(false);

                SearchRequest.Current.language = null;
                SearchRequest.Current.series = [];
                SearchRequest.Current.genres = [];
                SearchRequest.Current.rent = null;
                SearchRequest.Current.text = null;
                SearchRequest.Current.page = 0;

                this.query();
            });

            // Allgemeine Informationen zur Anwendung abrufen - eventuell dauert das etwas, da die Datenbank gestartet werden muss
            this.requestApplicationInformation().done(info => {
                $('#headline').text('VCR.NET Mediendatenbank');

                this.fillApplicationInformation(info);

                // Ab jetzt sind wir bereit
                $('#main').removeClass(Styles.invisble);
            });
        }
    }
} 
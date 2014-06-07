/// <reference path='typings/jquery/jquery.d.ts' />
/// <reference path='typings/jqueryui/jqueryui.d.ts' />


module MovieDatabase {

    class Styles {
        static invisble = 'invisible';

        static loading = 'stateLoading';

        static busy = 'stateBusy';

        static idle = 'stateIdle';

        static pageButton = 'pageButton';

        static activePageButton = 'pageButtonSelected';
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

    // Die Informationen zu einer Tonspur
    interface ILanguage {
        id: string;

        description: string;
    }

    // Die Information zu eiuner einzelnen Art von Aufnahme
    interface IGenre {
        id: string;

        description: string;
    }

    // Die Minimalinformation zu einer Serie
    interface ISeriesMappingContract {
        id: string;

        parentId: string;

        name: string;

        hierarchicalName: string;
    }

    // Die vom Client erweitere Minimalinformation zu einer Serie
    interface ISeriesMapping extends ISeriesMappingContract {
        children: ISeriesMapping[];
    }

    // Die Beschreibung einer Aufnahme in der Tabelle - eine Kurzfassung
    interface IRecordingInfoContract {
        id: string;

        title: string;

        rent: string;

        createdAsString: string;

        series: string;

        languages: string[];

        genres: string[];
    }

    // Die vom Client erweiterte Beschreibung einer Aufnahme in der Tabelle
    interface IRecordingInfo extends IRecordingInfoContract {
        created: Date;

        hierarchicalName: string;
    }

    // Die Eigenschaften, nach denen Aufzeichnungen sortiert werden können
    class OrderSelector {
        static title: string = 'titleWithSeries';

        static created: string = 'date';
    }

    // Eine Suchanfrage
    class SearchRequest {
        constructor() {
        }

        size: number = 15;

        page: number = 0;

        order: string = OrderSelector.title;

        ascending: boolean = true;

        genres: string[] = [];

        language: string = null;

        series: string = null;

        rent: boolean = null;

        text: string = null;

        private pending: number = 0;

        send(): JQueryPromise<ISearchInformation> {

            // Jede Suche bekommt eine neue Nummer und es wird immer nur das letzte Ergebnis ausgewertet
            var thisRequest = ++this.pending;

            return $.ajax('movie/db', {
                contentType: 'application/json; charset=utf-8',
                data: JSON.stringify(this),
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

    // Das Ergebnis einer Suche so wie der Dienst sie meldet
    interface ISearchInformationContract {
        size: number;

        page: number;

        total: number;

        recordings: IRecordingInfo[];
    }

    interface ISearchInformation extends ISearchInformationContract {
        ignore: boolean;
    }

    // Einige Informationen zur Anwendungsumgebung
    interface IApplicationInformation {
        empty: boolean;

        total: number;

        languages: ILanguage[];

        genres: IGenre[];

        series: ISeriesMapping[];

        seriesSeparator: string;
    };

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

        private languageFilter: JQuery;

        private genreFilter: JQuery;

        private genreFilterHeader: JQuery;

        private pageSize: JQuery;

        private pageSizeCount: JQuery;

        private textSearch: JQuery;

        private pageButtons: JQuery;

        private seriesMap: any;

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

            this.languageFilter.empty();
            this.languageFilter.append(new Option('(egal)', '', true, true));

            $.each(this.currentApplicationInformation.languages, (index, language) => {
                this.languageFilter.append(new Option(language.id, language.description));
            });
        }

        private setGenres(): void {
            this.genreFilter.empty();

            $.each(this.currentApplicationInformation.genres, (index, genre) => {
                var capturedGenre = genre;
                var id = 'genreCheckbox' + capturedGenre.id;

                $('<input />', { type: 'checkbox', id: id, name: capturedGenre.id }).appendTo(this.genreFilter).change(() => this.genreChanged(true));
                $('<label />', { 'for': id, text: capturedGenre.description }).appendTo(this.genreFilter);
            });

            this.genreChanged(false);
        }

        private selectedGenres(processor: (checkbox: JQuery) => void): void {
            this.genreFilter.children('input[type=checkbox]:checked').each((index, checkbox) => processor($(checkbox)));
        }

        private genreChanged(query: boolean): void {
            SearchRequest.Current.genres = [];
            SearchRequest.Current.page = 0;

            this.selectedGenres(checkbox => SearchRequest.Current.genres.push(checkbox.attr('name')));

            if (SearchRequest.Current.genres.length < 1)
                this.genreFilterHeader.text('(egal)');
            else
                this.genreFilterHeader.text(SearchRequest.Current.genres.join(' und '));

            if (query)
                this.query();
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

            this.seriesMap = {};

            $.each(info.series, (index, mapping) => {
                mapping.children = [];

                this.seriesMap[mapping.id] = mapping;
            });

            $.each(info.series, (index, mapping) => {
                if (mapping.parentId == null)
                    return;

                var parent: ISeriesMapping = this.seriesMap[mapping.parentId];

                parent.children.push(mapping);
            });

            this.setGenres();
            this.setLanguages();

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

            var tableBody = $('#recordingTable>tbody');

            tableBody.empty();

            $.each(results.recordings, (index, recording) => {
                if (recording.series == null)
                    recording.hierarchicalName = recording.title;
                else {
                    var series: ISeriesMapping = this.seriesMap[recording.series];

                    recording.hierarchicalName = series.hierarchicalName + ' ' + this.currentApplicationInformation.seriesSeparator + ' ' + recording.title;
                }

                var recordingRow = $('<tr></tr>').appendTo(tableBody);

                $('<td />').appendTo(recordingRow).text(recording.hierarchicalName);
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

        private startup(): void {
            this.busyIndicator = $('#busyIndicator');

            this.legacyFile = $('#theFile');
            this.legacyFile.change(() => this.migrate());

            this.migrateButton = $('#migrate');
            this.migrateButton.button().click(() => this.legacyFile.click());

            this.languageFilter = $('#languageFilter');
            this.languageFilter.change(() => {
                SearchRequest.Current.language = this.languageFilter.val();
                SearchRequest.Current.page = 0;

                this.query();
            });

            this.genreFilter = $('#genreFilter');
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

            this.pageButtons = $('#pageButtons');

            $('#resetQuery').button().click(() => {
                this.selectedGenres(checkbox => checkbox.prop('checked', false));
                this.languageFilter.val(null);
                this.textSearch.val(null);
                this.genreChanged(false);

                SearchRequest.Current.language = null;
                SearchRequest.Current.series = null;
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
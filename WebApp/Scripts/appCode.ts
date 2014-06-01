/// <reference path='typings/jquery/jquery.d.ts' />
/// <reference path='typings/jqueryui/jqueryui.d.ts' />


module MovieDatabase {

    class Styles {
        static invisble = 'invisible';
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

    // Die Beschreibung einer Aufnahme in der Tabelle - eine Kurzfassung
    interface IRecordingInfo {
        id: string;

        title: string;

        createdAsString: string;

        created: Date;

        languages: string[];

        genres: string[];
    }

    // Die Eigenschaften, nach denen Aufzeichnungen sortiert werden können
    class OrderSelector {
        static title: string = 'title';

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

        send(): JQueryPromise<ISearchInformation> {

            return $.ajax('movie/db', {
                contentType: "application/json; charset=utf-8",
                data: JSON.stringify(this),
                dataType: "json",
                type: "POST",
            }).done((searchResult: ISearchInformation) => {
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

    // Das Ergebnis einer Suche
    interface ISearchInformation {
        page: number;

        index: number;

        total: number;

        recordings: IRecordingInfo[];
    }

    // Einige Informationen zur Anwendungsumgebung
    interface IApplicationInformation {
        empty: boolean;

        total: number;
    };

    // Repräsentiert die Anwendung als Ganzes
    class Application {
        constructor() {
            $(() => this.startup());
        }

        static Current: Application = new Application();

        private legacyFile: JQuery;

        private migrateButton: JQuery;

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

        private fillApplicationInformation(info: IApplicationInformation): void {
            if (info.empty)
                this.migrateButton.removeClass(Styles.invisble);
            else
                this.migrateButton.addClass(Styles.invisble);

            $('#countInfo').text('(Es gibt ' + info.total + ' Aufzeichnung' + ((info.total == 1) ? '' : 'en') + ')');
        }

        private requestApplicationInformation(): JQueryPromise<IApplicationInformation> {
            return $.ajax('movie/info');
        }

        private startup(): void {
            // Migration vorbereiten
            this.legacyFile = $('#theFile');
            this.legacyFile.change(() => this.migrate());

            this.migrateButton = $('#migrate');
            this.migrateButton.button().click(() => this.legacyFile.click());

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
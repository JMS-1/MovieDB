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

    // Die Beschreibung einer Aufnahme
    interface IRecording {
        id: string;

        title: string;

        languages: ILanguage[];
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
            });
        }

        static Current: SearchRequest = new SearchRequest();
    }

    // Das Ergebnis einer Suche
    interface ISearchInformation {
        page: number;

        index: number;

        total: number;

        recordings: IRecording[];
    }

    // Einige Informationen zur Anwendungsumgebung
    interface IApplicationInformation {
        empty: boolean;
    };

    $(() => {
        // Allgemeine Informationen zur Anwendung abrufen - eventuell dauert das etwas, da die Datenbank gestartet werden muss
        $.ajax('movie/info').done((result: IApplicationInformation) => {
            // Ab jetzt sind wir bereit
            $('#headline').text('VCR.NET Mediendatenbank');
            $('#main').removeClass(Styles.invisble);
        });

        $('#startUpload').button()
            .click(evo => {
                var fileInput = <HTMLInputElement>($('#theFile')[0]);
                if (fileInput.files.length != 1)
                    return;

                var data = new FormData();
                data.append('legacyFile', fileInput.files[0]);

                $
                    .ajax('movie/db/initialize', {
                        contentType: false,
                        processData: false,
                        type: 'POST',
                        data: data,
                    })
                    .done(data => {
                    })
            });
    });
} 
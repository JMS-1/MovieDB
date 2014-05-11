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

        // Spielkram!
        $
            .ajax('movie/db')
            .done((result: ISearchInformation) => {
                var x = result;
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
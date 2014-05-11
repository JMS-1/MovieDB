/// <reference path='typings/jquery/jquery.d.ts' />
/// <reference path='typings/jqueryui/jqueryui.d.ts' />
var MovieDatabase;
(function (MovieDatabase) {
    var Styles = (function () {
        function Styles() {
        }
        Styles.invisble = 'invisible';
        return Styles;
    })();

    

    

    

    
    ;

    $(function () {
        // Allgemeine Informationen zur Anwendung abrufen - eventuell dauert das etwas, da die Datenbank gestartet werden muss
        $.ajax('movie/info').done(function (result) {
            // Ab jetzt sind wir bereit
            $('#headline').text('VCR.NET Mediendatenbank');
            $('#main').removeClass(Styles.invisble);
        });

        // Spielkram!
        $.ajax('movie/db').done(function (result) {
            var x = result;
        });

        $('#startUpload').button().click(function (evo) {
            var fileInput = ($('#theFile')[0]);
            if (fileInput.files.length != 1)
                return;

            var data = new FormData();
            data.append('legacyFile', fileInput.files[0]);

            $.ajax('movie/db/initialize', {
                contentType: false,
                processData: false,
                type: 'POST',
                data: data
            }).done(function (data) {
            });
        });
    });
})(MovieDatabase || (MovieDatabase = {}));
//# sourceMappingURL=appCode.js.map

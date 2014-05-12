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

    

    

    // Die Eigenschaften, nach denen Aufzeichnungen sortiert werden können
    var OrderSelector = (function () {
        function OrderSelector() {
        }
        OrderSelector.title = 'title';

        OrderSelector.created = 'date';
        return OrderSelector;
    })();

    // Eine Suchanfrage
    var SearchRequest = (function () {
        function SearchRequest() {
            this.size = 15;
            this.page = 0;
            this.order = OrderSelector.title;
            this.ascending = true;
        }
        SearchRequest.prototype.send = function () {
            return $.ajax('movie/db', {
                contentType: "application/json; charset=utf-8",
                data: JSON.stringify(this),
                dataType: "json",
                type: "POST"
            });
        };

        SearchRequest.Current = new SearchRequest();
        return SearchRequest;
    })();

    

    
    ;

    $(function () {
        // Allgemeine Informationen zur Anwendung abrufen - eventuell dauert das etwas, da die Datenbank gestartet werden muss
        $.ajax('movie/info').done(function (result) {
            // Ab jetzt sind wir bereit
            $('#headline').text('VCR.NET Mediendatenbank');
            $('#main').removeClass(Styles.invisble);
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

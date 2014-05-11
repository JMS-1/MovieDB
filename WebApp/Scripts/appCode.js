/// <reference path='typings/jquery/jquery.d.ts' />
/// <reference path='typings/jqueryui/jqueryui.d.ts' />
var VCRServer;
(function (VCRServer) {
    $(function () {
        $.ajax('movie/db').done(function (data) {
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
})(VCRServer || (VCRServer = {}));
//# sourceMappingURL=appCode.js.map

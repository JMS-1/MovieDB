/// <reference path='typings/jquery/jquery.d.ts' />
/// <reference path='typings/jqueryui/jqueryui.d.ts' />

module VCRServer {
    $(() => {
        $
            .ajax('movie/db')
            .done(data => {
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
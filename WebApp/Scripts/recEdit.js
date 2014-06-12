/// <reference path='typings/jquery/jquery.d.ts' />
/// <reference path='typings/jqueryui/jqueryui.d.ts' />
/// <reference path='interfaces.ts' />
var RecordingEditor = (function () {
    function RecordingEditor(recording) {
        this.original = recording;

        $('#recordingEditTitle').val(recording.title);

        $('#editRecordingMode').removeClass(Styles.invisble);
    }
    RecordingEditor.prototype.save = function () {
        var newData = {
            languages: this.original.languages,
            title: $('#recordingEditTitle').val(),
            series: this.original.series,
            genres: this.original.genres,
            rent: this.original.rent,
            id: this.original.id
        };

        if (!RecordingEditor.validate(newData))
            return;
    };

    RecordingEditor.validate = function (recording) {
        return false;
    };
    return RecordingEditor;
})();
//# sourceMappingURL=recEdit.js.map

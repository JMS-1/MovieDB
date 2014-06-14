/// <reference path='typings/jquery/jquery.d.ts' />
/// <reference path='typings/jqueryui/jqueryui.d.ts' />
/// <reference path='interfaces.ts' />
var RecordingEditor = (function () {
    function RecordingEditor(recording) {
        this.original = recording;

        RecordingEditor.titleField().val(recording.title);

        this.validate();

        $('#editRecordingMode').removeClass(Styles.invisble);
    }
    RecordingEditor.titleField = function () {
        return $('#recordingEditTitle');
    };

    RecordingEditor.saveButton = function () {
        return $('#updateRecording');
    };

    RecordingEditor.prototype.save = function () {
        var newData = this.createContract();

        if (!this.validate(newData))
            return;
    };

    RecordingEditor.prototype.createContract = function () {
        var newData = {
            title: (RecordingEditor.titleField().val() || '').trim(),
            languages: this.original.languages,
            series: this.original.series,
            genres: this.original.genres,
            rent: this.original.rent,
            id: this.original.id
        };

        return newData;
    };

    RecordingEditor.prototype.validateTitle = function (recording) {
        var title = recording.title;

        if (title.length < 1)
            return 'Es muss ein Name angegeben werden';
        else if (title.length > 200)
            return 'Der Name darf maximal 200 Zeichen haben';
        else
            return null;
    };

    RecordingEditor.prototype.validate = function (recording) {
        if (typeof recording === "undefined") { recording = null; }
        var isValid = true;

        if (recording == null)
            recording = this.createContract();

        if (Tools.setError(RecordingEditor.titleField(), this.validateTitle(recording)))
            isValid = false;

        RecordingEditor.saveButton().button('option', 'disabled', !isValid);
    };
    return RecordingEditor;
})();
//# sourceMappingURL=recEdit.js.map

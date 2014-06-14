/// <reference path='typings/jquery/jquery.d.ts' />
/// <reference path='typings/jqueryui/jqueryui.d.ts' />
/// <reference path='interfaces.ts' />
/// <reference path='uiHelper.ts' />
var RecordingEditor = (function () {
    function RecordingEditor(recording, genreEditor, languageEditor) {
        this.original = recording;
        this.genreEditor = genreEditor;
        this.languageEditor = languageEditor;

        RecordingEditor.rentField().val(recording.rent);
        RecordingEditor.titleField().val(recording.title);
        RecordingEditor.descriptionField().val(recording.description);

        languageEditor.value(recording.languages);
        genreEditor.value(recording.genres);

        this.validate();

        $('#editRecordingMode').removeClass(Styles.invisble);
    }
    RecordingEditor.saveButton = function () {
        return $('#updateRecording');
    };

    RecordingEditor.titleField = function () {
        return $('#recordingEditTitle');
    };

    RecordingEditor.descriptionField = function () {
        return $('#recordingEditDescription');
    };

    RecordingEditor.seriesField = function () {
        return $('#recordingEditSeries');
    };

    RecordingEditor.meditField = function () {
        return $('#recordingEditMedia');
    };

    RecordingEditor.genreField = function () {
        return $('#recordingEditGenre');
    };

    RecordingEditor.languageField = function () {
        return $('#recordingEditLanguage');
    };

    RecordingEditor.containerField = function () {
        return $('#recordingEditContainer');
    };

    RecordingEditor.locationField = function () {
        return $('#recordingEditLocation');
    };

    RecordingEditor.rentField = function () {
        return $('#recordingEditRent');
    };

    RecordingEditor.prototype.save = function () {
        var newData = this.createContract();

        if (!this.validate(newData))
            return;
    };

    RecordingEditor.prototype.createContract = function () {
        var newData = {
            description: (RecordingEditor.descriptionField().val() || '').trim(),
            title: (RecordingEditor.titleField().val() || '').trim(),
            rent: (RecordingEditor.rentField().val() || '').trim(),
            languages: this.languageEditor.value(),
            genres: this.genreEditor.value(),
            series: this.original.series,
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

    RecordingEditor.prototype.validateDescription = function (recording) {
        var description = recording.description;

        if (description.length > 2000)
            return 'Die Beschreibung darf maximal 2.000 Zeichen haben';
        else
            return null;
    };

    RecordingEditor.prototype.validateRentTo = function (recording) {
        var rent = recording.rent;

        if (rent.length > 200)
            return 'Der Name des Entleihers darf maximal 200 Zeichen haben';
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
        if (Tools.setError(RecordingEditor.descriptionField(), this.validateDescription(recording)))
            isValid = false;
        if (Tools.setError(RecordingEditor.rentField(), this.validateRentTo(recording)))
            isValid = false;

        RecordingEditor.saveButton().button('option', 'disabled', !isValid);

        return isValid;
    };
    return RecordingEditor;
})();
//# sourceMappingURL=recEdit.js.map

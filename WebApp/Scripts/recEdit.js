﻿/// <reference path='typings/jquery/jquery.d.ts' />
/// <reference path='typings/jqueryui/jqueryui.d.ts' />
/// <reference path='interfaces.ts' />
/// <reference path='uiHelper.ts' />
var RecordingEditor = (function () {
    function RecordingEditor(recording, genreEditor, languageEditor) {
        this.identifier = recording.id;
        this.genreEditor = genreEditor;
        this.languageEditor = languageEditor;

        RecordingEditor.mediaField().val(recording.mediaType.toString());
        RecordingEditor.descriptionField().val(recording.description);
        RecordingEditor.containerField().val(recording.container);
        RecordingEditor.locationField().val(recording.location);
        RecordingEditor.seriesField().val(recording.series);
        RecordingEditor.titleField().val(recording.title);
        RecordingEditor.titleField().val(recording.title);
        RecordingEditor.rentField().val(recording.rent);

        languageEditor.val(recording.languages);
        genreEditor.val(recording.genres);

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

    RecordingEditor.mediaField = function () {
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

    RecordingEditor.prototype.save = function (success) {
        var newData = this.createContract();

        if (!this.validate(newData))
            return;

        var url = 'movie/db';
        if (this.identifier.length > 0)
            url += '/' + this.identifier;

        $.ajax(url, {
            type: (this.identifier.length < 1) ? 'POST' : 'PUT',
            contentType: 'application/json; charset=utf-8',
            data: JSON.stringify(newData)
        }).done(success).fail(function () {
            // Bei der Fehlerbehandlung ist noch Potential
            alert('Da ist leider etwas schief gegangen');
        });
    };

    RecordingEditor.prototype.createContract = function () {
        var newData = {
            description: (RecordingEditor.descriptionField().val() || '').trim(),
            location: (RecordingEditor.locationField().val() || '').trim(),
            title: (RecordingEditor.titleField().val() || '').trim(),
            mediaType: parseInt(RecordingEditor.mediaField().val()),
            rent: (RecordingEditor.rentField().val() || '').trim(),
            container: RecordingEditor.containerField().val(),
            series: RecordingEditor.seriesField().val(),
            languages: this.languageEditor.val(),
            genres: this.genreEditor.val(),
            id: null
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

    RecordingEditor.prototype.validateLocation = function (recording) {
        var location = recording.location;

        if (location.length > 100)
            return 'Die Position im Container darf maximal 100 Zeichen haben';
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
        if (Tools.setError(RecordingEditor.locationField(), this.validateLocation(recording)))
            isValid = false;

        RecordingEditor.saveButton().button('option', 'disabled', !isValid);

        return isValid;
    };
    return RecordingEditor;
})();
//# sourceMappingURL=recEdit.js.map

var RecordingEditor = (function () {
    function RecordingEditor(recording, genreEditor, languageEditor) {
        this.languageEditor = languageEditor;
        this.genreEditor = genreEditor;

        this.initialize(recording);

        $('#editRecordingMode').removeClass(Styles.invisble);
    }
    RecordingEditor.prototype.initialize = function (recording) {
        if (recording == null) {
            this.identifier = null;
            RecordingEditor.descriptionField().val('');
            RecordingEditor.containerField().val('');
            RecordingEditor.locationField().val('');
            RecordingEditor.mediaField().val('0');
            RecordingEditor.seriesField().val('');
            RecordingEditor.titleField().val('');
            RecordingEditor.rentField().val('');

            this.languageEditor.val([]);
            this.genreEditor.val([]);
        } else {
            this.identifier = recording.id;
            RecordingEditor.mediaField().val(recording.mediaType.toString());
            RecordingEditor.descriptionField().val(recording.description);
            RecordingEditor.containerField().val(recording.container);
            RecordingEditor.locationField().val(recording.location);
            RecordingEditor.seriesField().val(recording.series);
            RecordingEditor.titleField().val(recording.title);
            RecordingEditor.rentField().val(recording.rent);

            this.languageEditor.val(recording.languages);
            this.genreEditor.val(recording.genres);
        }

        this.validate();
    };

    RecordingEditor.saveButton = function () {
        return $('#updateRecording');
    };

    RecordingEditor.saveAndNewButton = function () {
        return $('#newAfterUpdateRecording');
    };

    RecordingEditor.saveAndCloneButton = function () {
        return $('#cloneAfterUpdateRecording');
    };

    RecordingEditor.cloneButton = function () {
        return $('#cloneRecording');
    };

    RecordingEditor.deleteButton = function () {
        return $('#deleteRecording');
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
        if (this.identifier != null)
            url += '/' + this.identifier;

        $.ajax(url, {
            type: (this.identifier == null) ? 'POST' : 'PUT',
            contentType: 'application/json; charset=utf-8',
            data: JSON.stringify(newData)
        }).done(success).fail(function () {
            // Bei der Fehlerbehandlung ist noch Potential
            alert('Da ist leider etwas schief gegangen');
        });
    };

    RecordingEditor.prototype.remove = function (success) {
        if (this.identifier == null)
            return;

        $.ajax('movie/db/' + this.identifier, {
            type: 'DELETE'
        }).done(success).fail(function () {
            // Bei der Fehlerbehandlung ist noch Potential
            alert('Da ist leider etwas schief gegangen');
        });
    };

    RecordingEditor.prototype.clone = function () {
        RecordingEditor.titleField().val('Kopie von ' + (RecordingEditor.titleField().val() || '').trim());

        this.identifier = null;

        this.validate();
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

        RecordingEditor.cloneButton().button('option', 'disabled', this.identifier == null);
        RecordingEditor.saveAndCloneButton().button('option', 'disabled', !isValid);
        RecordingEditor.saveAndNewButton().button('option', 'disabled', !isValid);
        RecordingEditor.saveButton().button('option', 'disabled', !isValid);

        return isValid;
    };
    return RecordingEditor;
})();
//# sourceMappingURL=recEdit.js.map

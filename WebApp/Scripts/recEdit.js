// Der Dialog zum Pflegen einer Aufzeichnung - diese Instanzen werden für jeden Änderungsvorgang neu erzeugt
var RecordingEditor = (function () {
    function RecordingEditor(recording, genreEditor, languageEditor) {
        this.languageEditor = languageEditor;
        this.genreEditor = genreEditor;
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
            this.links([]);
        }
        else {
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
            this.links(recording.links);
        }
        this.validate();
        $('#editRecordingMode').removeClass(Styles.invisble);
    }
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
    RecordingEditor.linkArea = function () {
        return $('#recordingEditLinks');
    };
    RecordingEditor.prototype.save = function (success) {
        var newData = this.viewToModel();
        if (!this.validate(newData))
            return;
        var url = 'movie/db';
        if (this.identifier != null)
            url += '/' + this.identifier;
        $.ajax(url, {
            type: (this.identifier == null) ? 'POST' : 'PUT',
            contentType: 'application/json; charset=utf-8',
            data: JSON.stringify(newData),
        })
            .done(success)
            .fail(function () { return alert('Da ist leider etwas schief gegangen'); });
    };
    RecordingEditor.prototype.remove = function (success) {
        if (this.identifier == null)
            return;
        $.ajax('movie/db/' + this.identifier, { type: 'DELETE' })
            .done(success)
            .fail(function () { return alert('Da ist leider etwas schief gegangen'); });
    };
    // Behält alle EIngabedaten bis auf den Titel bei und markiert die aktuelle Aufzeichnung als
    // eine neu angelegte Aufzeichnung. Der Titel erhält einen entsprechenden Zusatz.
    RecordingEditor.prototype.clone = function () {
        RecordingEditor.titleField().val('Kopie von ' + (RecordingEditor.titleField().val() || '').trim());
        this.identifier = null;
        this.validate();
    };
    // Überträgt die Eingabefelder in die zugehörige Datenstruktur.
    RecordingEditor.prototype.viewToModel = function () {
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
            id: this.identifier,
            links: this.links(),
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
        if (recording === void 0) { recording = null; }
        var isValid = true;
        if (recording == null)
            recording = this.viewToModel();
        // Wir prüfen im wesentlichen die Freitextfelder auf deren Länge
        if (Tools.setError(RecordingEditor.titleField(), this.validateTitle(recording)))
            isValid = false;
        if (Tools.setError(RecordingEditor.descriptionField(), this.validateDescription(recording)))
            isValid = false;
        if (Tools.setError(RecordingEditor.rentField(), this.validateRentTo(recording)))
            isValid = false;
        if (Tools.setError(RecordingEditor.locationField(), this.validateLocation(recording)))
            isValid = false;
        // Die Schaltflächen werden gemäß dem aktuellen Formularstand frei geschaltet
        RecordingEditor.cloneButton().button('option', 'disabled', this.identifier == null);
        RecordingEditor.saveAndCloneButton().button('option', 'disabled', !isValid);
        RecordingEditor.saveAndNewButton().button('option', 'disabled', !isValid);
        RecordingEditor.saveButton().button('option', 'disabled', !isValid);
        return isValid;
    };
    RecordingEditor.prototype.links = function (newVal) {
        var area = RecordingEditor.linkArea();
        if (newVal) {
            area.empty();
            // Wir zeigen die Verweise in alphabetischer Reihenfolge an und ignorieren die gespeicherte Ordnung (für den Moment)
            newVal.sort(function (l, r) { return l.name.localeCompare(r.name); });
            // Und der Einfachheit halber erstellen wir die einfachen jQuery Schaltflächen - da ist sicher noch UX Luft nach oben
            $.each(newVal, function (index, link) { return $('<a />', {
                href: link.url,
                text: link.name,
                target: '_blank',
                title: link.description,
            }).appendTo(area).button(); });
            return newVal;
        }
        else
            // Das Gegenstück zur obigen Erstellung der Schaltflächen
            return $.map(area.children(), function (anchor) {
                var link = {
                    description: anchor.title,
                    name: $(anchor).text(),
                    url: anchor.href,
                };
                return link;
            });
    };
    return RecordingEditor;
}());
//# sourceMappingURL=recEdit.js.map
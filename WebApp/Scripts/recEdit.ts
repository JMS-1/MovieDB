
// Der Dialog zum Pflegen einer Aufzeichnung - diese Instanzen werden für jeden Änderungsvorgang neu erzeugt
class RecordingEditor {
    constructor(recording: IRecordingEditContract, genreEditor: MultiValueEditor<IGenreContract>, languageEditor: MultiValueEditor<ILanguageContract>) {
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
            this.links(recording.links);
        }

        this.validate();

        $('#editRecordingMode').removeClass(Styles.invisble);
    }

    private genreEditor: MultiValueEditor<IGenreContract>;

    private languageEditor: MultiValueEditor<ILanguageContract>;

    private identifier: string;

    static saveButton(): JQuery {
        return $('#updateRecording');
    }

    static saveAndNewButton(): JQuery {
        return $('#newAfterUpdateRecording');
    }

    static saveAndCloneButton(): JQuery {
        return $('#cloneAfterUpdateRecording');
    }

    static cloneButton(): JQuery {
        return $('#cloneRecording');
    }

    static deleteButton(): JQuery {
        return $('#deleteRecording');
    }

    static titleField(): JQuery {
        return $('#recordingEditTitle');
    }

    static descriptionField(): JQuery {
        return $('#recordingEditDescription');
    }

    static seriesField(): JQuery {
        return $('#recordingEditSeries');
    }

    static mediaField(): JQuery {
        return $('#recordingEditMedia');
    }

    static genreField(): JQuery {
        return $('#recordingEditGenre');
    }

    static languageField(): JQuery {
        return $('#recordingEditLanguage');
    }

    static containerField(): JQuery {
        return $('#recordingEditContainer');
    }

    static locationField(): JQuery {
        return $('#recordingEditLocation');
    }

    static rentField(): JQuery {
        return $('#recordingEditRent');
    }

    static linkArea(): JQuery {
        return $('#recordingEditLinks');
    }

    save(success: () => void): void {
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
            .fail(() => alert('Da ist leider etwas schief gegangen'));
    }

    remove(success: () => void): void {
        if (this.identifier == null)
            return;

        $.ajax('movie/db/' + this.identifier, { type: 'DELETE' })
            .done(success)
            .fail(() => alert('Da ist leider etwas schief gegangen'));
    }

    // Behält alle EIngabedaten bis auf den Titel bei und markiert die aktuelle Aufzeichnung als
    // eine neu angelegte Aufzeichnung. Der Titel erhält einen entsprechenden Zusatz.
    clone(): void {
        RecordingEditor.titleField().val('Kopie von ' + (RecordingEditor.titleField().val() || '').trim());

        this.identifier = null;

        this.validate();
    }

    // Überträgt die Eingabefelder in die zugehörige Datenstruktur.
    public viewToModel(): IRecordingEditContract {
        var newData: IRecordingEditContract =
            {
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
    }

    private validateTitle(recording: IRecordingEditContract): string {
        var title = recording.title;

        if (title.length < 1)
            return 'Es muss ein Name angegeben werden';
        else if (title.length > 200)
            return 'Der Name darf maximal 200 Zeichen haben';
        else
            return null;
    }

    private validateDescription(recording: IRecordingEditContract): string {
        var description = recording.description;

        if (description.length > 2000)
            return 'Die Beschreibung darf maximal 2.000 Zeichen haben';
        else
            return null;
    }

    private validateRentTo(recording: IRecordingEditContract): string {
        var rent = recording.rent;

        if (rent.length > 200)
            return 'Der Name des Entleihers darf maximal 200 Zeichen haben';
        else
            return null;
    }

    private validateLocation(recording: IRecordingEditContract): string {
        var location = recording.location;

        if (location.length > 100)
            return 'Die Position im Container darf maximal 100 Zeichen haben';
        else
            return null;
    }

    validate(recording: IRecordingEditContract = null): boolean {
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
    }

    links(): ILinkEditContract[];

    links(newVal: ILinkEditContract[]): void;

    links(newVal?: ILinkEditContract[]): ILinkEditContract[] {
        var area = RecordingEditor.linkArea();

        if (newVal) {
            area.empty();

            // Wir zeigen die Verweise in alphabetischer Reihenfolge an und ignorieren die gespeicherte Ordnung (für den Moment)
            newVal.sort((l, r) => l.name.localeCompare(r.name));

            // Und der Einfachheit halber erstellen wir die einfachen jQuery Schaltflächen - da ist sicher noch UX Luft nach oben
            $.each(newVal, (index, link) => $('<a />',
                {
                    href: link.url,
                    text: link.name,
                    target: '_blank',
                    title: link.description,
                }).appendTo(area).button());

            return newVal;
        }
        else
            // Das Gegenstück zur obigen Erstellung der Schaltflächen
            return $.map(area.children(), (anchor: HTMLAnchorElement) => {
                var link: ILinkEditContract = {
                    description: anchor.title,
                    name: $(anchor).text(),
                    url: anchor.href,
                };

                return link;
            });
    }
}
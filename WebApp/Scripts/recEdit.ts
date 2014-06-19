/// <reference path='typings/jquery/jquery.d.ts' />
/// <reference path='typings/jqueryui/jqueryui.d.ts' />
/// <reference path='interfaces.ts' />
/// <reference path='uiHelper.ts' />

class RecordingEditor {
    constructor(recording: IRecordingEditContract, genreEditor: MultiValueEditor<IGenreContract>, languageEditor: MultiValueEditor<ILanguageContract>) {
        this.genreEditor = genreEditor;
        this.languageEditor = languageEditor;

        if (recording == null) {
            this.identifier = '';
            RecordingEditor.descriptionField().val('');
            RecordingEditor.containerField().val('');
            RecordingEditor.locationField().val('');
            RecordingEditor.mediaField().val('0');
            RecordingEditor.seriesField().val('');
            RecordingEditor.titleField().val('');
            RecordingEditor.rentField().val('');

            languageEditor.val([]);
            genreEditor.val([]);
        } else {
            this.identifier = recording.id;
            RecordingEditor.mediaField().val(recording.mediaType.toString());
            RecordingEditor.descriptionField().val(recording.description);
            RecordingEditor.containerField().val(recording.container);
            RecordingEditor.locationField().val(recording.location);
            RecordingEditor.seriesField().val(recording.series);
            RecordingEditor.titleField().val(recording.title);
            RecordingEditor.rentField().val(recording.rent);

            languageEditor.val(recording.languages);
            genreEditor.val(recording.genres);
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

    save(success: () => void): void {
        var newData = this.createContract();

        if (!this.validate(newData))
            return;

        var url = 'movie/db';
        if (this.identifier.length > 0)
            url += '/' + this.identifier;

        $
            .ajax(url, {
                type: (this.identifier.length < 1) ? 'POST' : 'PUT',
                contentType: 'application/json; charset=utf-8',
                data: JSON.stringify(newData),
            })
            .done(success)
            .fail(() => {
                // Bei der Fehlerbehandlung ist noch Potential
                alert('Da ist leider etwas schief gegangen');
            });
    }

    private createContract(): IRecordingEditContract {
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
                id: null,
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
    }
}
/// <reference path='typings/jquery/jquery.d.ts' />
/// <reference path='typings/jqueryui/jqueryui.d.ts' />
/// <reference path='interfaces.ts' />
/// <reference path='uiHelper.ts' />

class RecordingEditor {
    constructor(recording: IRecordingEditContract, genreEditor: MultiValueEditor<IGenreContract>, languageEditor: MultiValueEditor<ILanguageContract>) {
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

    private genreEditor: MultiValueEditor<IGenreContract>;

    private languageEditor: MultiValueEditor<ILanguageContract>;

    private original: IRecordingEditContract;

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

    static meditField(): JQuery {
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

    save(): void {
        var newData = this.createContract();

        if (!this.validate(newData))
            return;
    }

    private createContract(): IRecordingEditContract {
        var newData: IRecordingEditContract =
            {
                description: (RecordingEditor.descriptionField().val() || '').trim(),
                title: (RecordingEditor.titleField().val() || '').trim(),
                rent: (RecordingEditor.rentField().val() || '').trim(),
                languages: this.languageEditor.value(),
                genres: this.genreEditor.value(),
                series: this.original.series,
                id: this.original.id,
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

        RecordingEditor.saveButton().button('option', 'disabled', !isValid);

        return isValid;
    }
}
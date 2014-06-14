/// <reference path='typings/jquery/jquery.d.ts' />
/// <reference path='typings/jqueryui/jqueryui.d.ts' />
/// <reference path='interfaces.ts' />

class RecordingEditor {
    constructor(recording: IRecordingEditContract) {
        this.original = recording;

        RecordingEditor.titleField().val(recording.title);

        this.validate();

        $('#editRecordingMode').removeClass(Styles.invisble);
    }

    private original: IRecordingEditContract;

    static titleField(): JQuery {
        return $('#recordingEditTitle');
    }

    static saveButton(): JQuery {
        return $('#updateRecording');
    }

    save(): void {
        var newData = this.createContract();

        if (!this.validate(newData))
            return;
    }

    private createContract(): IRecordingEditContract {
        var newData: IRecordingEditContract =
            {
                title: (RecordingEditor.titleField().val() || '').trim(),
                languages: this.original.languages,
                series: this.original.series,
                genres: this.original.genres,
                rent: this.original.rent,
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

    validate(recording: IRecordingEditContract = null): void {
        var isValid = true;

        if (recording == null)
            recording = this.createContract();

        if (Tools.setError(RecordingEditor.titleField(), this.validateTitle(recording)))
            isValid = false;

        RecordingEditor.saveButton().button('option', 'disabled', !isValid);
    }
}
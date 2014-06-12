/// <reference path='typings/jquery/jquery.d.ts' />
/// <reference path='typings/jqueryui/jqueryui.d.ts' />
/// <reference path='interfaces.ts' />

class RecordingEditor {
    constructor(recording: IRecordingEditContract) {
        this.original = recording;

        $('#recordingTitle').val(recording.title);

        $('#editRecordingMode').removeClass(Styles.invisble);
    }

    private original: IRecordingEditContract;

    save(): void {
        var newData: IRecordingEditContract =
            {
                languages: this.original.languages,
                title: $('#recordingTitle').val(),
                series: this.original.series,
                genres: this.original.genres,
                rent: this.original.rent,
                id: this.original.id,
            };

        if (!RecordingEditor.validate(newData))
            return;
    }

    private static validate(recording: IRecordingEditContract): boolean {
        return false;
    }
}
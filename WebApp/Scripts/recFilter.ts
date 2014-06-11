/// <reference path='typings/jquery/jquery.d.ts' />
/// <reference path='typings/jqueryui/jqueryui.d.ts' />
/// <reference path='interfaces.ts' />
/// <reference path='uiHelper.ts' />

interface IRecordingInfo extends IRecordingRowContract {
    created: Date;

    hierarchicalName: string;
}

interface ISearchInformation extends ISearchInformationContract {
    recordings: IRecordingInfo[];

    ignore: boolean;
}

class RecordingFilter extends SearchRequestContract {
    private pending: number = 0;

    private static propertyFilter(propertyName: string, propertyValue: any): any {
        if (propertyName != 'pending')
            return propertyValue;

        return undefined;
    }

    send(): JQueryPromise<ISearchInformation> {

        // Jede Suche bekommt eine neue Nummer und es wird immer nur das letzte Ergebnis ausgewertet
        var thisRequest = ++this.pending;

        return $.ajax('movie/db', {
            contentType: 'application/json; charset=utf-8',
            data: JSON.stringify(this, RecordingFilter.propertyFilter),
            dataType: 'json',
            type: 'POST',
        }).done((searchResult: ISearchInformation) => {

                // Veraltete Ergebnisse überspringen wir einfach
                searchResult.ignore = (this.pending != thisRequest);
                if (searchResult.ignore)
                    return;

                if (searchResult == null)
                    return;

                var recordings = searchResult.recordings;
                if (recordings == null)
                    return;

                // Ein wenig Vorarbeit hübscht die Daten vom Web Service etwas auf: aus der Rohdarstellung des Datums machen wir ein Date Objekt
                $.each(recordings, (index, recording) => recording.created = new Date(recording.createdAsString));
            });
    }
} 
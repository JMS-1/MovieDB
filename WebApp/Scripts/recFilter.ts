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
    constructor(resultProcessor: (result: ISearchInformation) => void) {
        super();

        this.callback = resultProcessor;

        this.prepareText();
        this.prepareRent();
    }

    private pending: number = 0;

    private callback: (result: ISearchInformation) => void;

    private static propertyFilter(propertyName: string, propertyValue: any): any {
        if (propertyName != 'pending')
            if (propertyName != 'callback')
                return propertyValue;

        return undefined;
    }

    reset(): void {
        var rentChooser = $('#rentFilter');

        // Oberfläche zurücksetzen
        rentChooser.find(':checked').prop('checked', false);
        $('#anyRent').prop('checked', true);
        rentChooser.buttonset('refresh');
        $('#textSearch').val(null);

        // Protokolldaten zurücksetzen
        this.language = null;
        this.series = [];
        this.genres = [];
        this.rent = null;
        this.text = null;
        this.page = 0;

        // Und aktualisieren
        this.query();
    }

    query(): void {
        // Anzeige auf der Oberfläche herrichten
        var busyIndicator = $('#busyIndicator');
        busyIndicator.removeClass(Styles.idle);
        busyIndicator.addClass(Styles.busy);

        // Jede Suche bekommt eine neue Nummer und es wird immer nur das letzte Ergebnis ausgewertet
        var thisRequest = ++this.pending;

        $.ajax('movie/db', {
            contentType: 'application/json; charset=utf-8',
            data: JSON.stringify(this, RecordingFilter.propertyFilter),
            dataType: 'json',
            type: 'POST',
        }).done((searchResult: ISearchInformation) => {
                // Veraltete Ergebnisse überspringen wir einfach
                searchResult.ignore = (this.pending != thisRequest);
                if (searchResult.ignore)
                    return;

                // Anzeige auf der Oberfläche herrichten
                var busyIndicator = $('#busyIndicator');
                busyIndicator.removeClass(Styles.busy);
                busyIndicator.addClass(Styles.idle);

                if (searchResult == null)
                    return;
                var recordings = searchResult.recordings;
                if (recordings == null)
                    return;

                // Ein wenig Vorarbeit hübscht die Daten vom Web Service etwas auf: aus der Rohdarstellung des Datums machen wir ein Date Objekt
                $.each(recordings, (index, recording) => recording.created = new Date(recording.createdAsString));

                // Und verarbeiten
                if (this.callback != null)
                    this.callback(searchResult);
            });
    }

    private onTextChanged(): void {
        this.text = $('#textSearch').val();
        this.page = 0;
    }

    private prepareText(): void {
        var textSearch = $('#textSearch');

        textSearch.on('change', () => this.onTextChanged());
        textSearch.on('input', () => this.onTextChanged());
        textSearch.on('keypress', (e: JQueryEventObject): void => {
            if (e.which == 13)
                this.query();
        });
    }

    private onRentChanged(): void {
        var rentChooser = $('#rentFilter');
        var choice: string = rentChooser.find(':checked').val();
        var newRent: boolean = null;

        if (choice.length > 0)
            newRent = (choice == '1');
        if (this.rent == newRent)
            return;

        this.rent = newRent;
        this.page = 0;

        this.query();
    }

    private prepareRent(): void {
        $('#rentFilter').buttonset().click(() => this.onRentChanged());
    }
} 
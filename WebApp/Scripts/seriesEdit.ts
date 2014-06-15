/// <reference path='typings/jquery/jquery.d.ts' />
/// <reference path='typings/jqueryui/jqueryui.d.ts' />
/// <reference path='interfaces.ts' />

class SeriesEditor {
    constructor(openButtonSelector: string, reloadApplicationData: () => void) {
        this.reload = reloadApplicationData;

        $(openButtonSelector).click(() => this.open());

        this.saveButton().click(() => this.save());
        this.cancelButton().click(() => this.close());
        this.deleteButton().click(() => this.remove());

        this.descriptionField().on('change', () => this.validate());
        this.descriptionField().on('input', () => this.validate());
        this.nameField().on('change', () => this.validate());
        this.nameField().on('input', () => this.validate());
        this.chooser().change(() => this.choose());
    }

    private reload: () => void;

    private seriesIdentifier: string = null;

    private open(): void {
        // Vorher noch einmal schnell alles aufbereiten - eventuell erfolgt auch ein Aufruf an den Web Service
        this.choose();

        this.dialog().dialog({
            position: { of: '#dialogAnchor', at: 'center top+20', my: 'center top' },
            closeOnEscape: false,
            width: 'auto',
            modal: true,
        });
    }

    private close() {
        this.dialog().dialog('close');
    }

    private restart(): void {
        this.close();

        // Wichtig ist, dass wir die neuen Listen in die Oberfläche laden
        this.reload();
    }

    private createUpdate(): ISeriesMappingContract {
        return null;
    }

    reset(list: ISeriesMappingContract[]): void {
        var chooser = this.chooser();
        var parentChooser = this.parentChooser();

        chooser.empty();
        parentChooser.empty();

        $(new Option('(Neue Serie anlegen)', '', true, true)).appendTo(chooser);
        $(new Option('(Keine)', '')).appendTo(parentChooser);

        $.each(list, (index, item) => $(new Option(item.hierarchicalName, item.id)).appendTo(chooser));
        $.each(list, (index, item) => $(new Option(item.hierarchicalName, item.id)).appendTo(parentChooser));
    }

    private validate(newData: ISeriesMappingContract = null): boolean {
        if (newData == null)
            newData = this.createUpdate();

        var isValid = true;

        if (Tools.setError(this.nameField(), this.validateName(newData)))
            isValid = false;
        if (Tools.setError(this.descriptionField(), this.validateDescription(newData)))
            isValid = false;

        this.saveButton().button('option', 'disabled', !isValid);

        return isValid;
    }

    private choose(): void {
        // Die aktuelle Auswahl ermitteln
        var choosen: string = this.chooser().val();

        // Und dann ganz defensiv erst einmal alles zurück setzen
        this.saveButton().button('option', 'disabled', choosen.length > 0);
        this.deleteButton().button('option', 'disabled', true);

        this.parentChooser().val('');
        this.nameField().val('');
        this.descriptionField().val('');

        if (choosen.length < 1) {
            // Einfach ist es, wenn wir etwas neu Anlegen
            this.seriesIdentifier = '';

            this.validate();
        }
        else {
            // Ansonsten fragen wir den Web Service immer nach dem neuesten Stand
            this.seriesIdentifier = null;

            $.ajax('movie/series/' + choosen).done((info: ISeriesEditInfo) => {
                if (info == null)
                    return;

                this.seriesIdentifier = info.id;

                this.nameField().val(info.name);
                this.descriptionField().val(info.description);
                this.parentChooser().val(info.parentId);

                this.deleteButton().button('option', 'disabled', !info.unused);

                // Für den unwahrscheinlichen Fall, dass sich die Spielregeln verändert haben - und um die Schaltfläche zum Speichern zu aktivieren
                this.validate();
            });
        }
    }

    private remove(): void {
        if (this.seriesIdentifier == null)
            return;
        if (this.seriesIdentifier)
            return;

        var newData = this.createUpdate();

        $
            .ajax('movie/series/' + newData.id, {
                type: 'DELETE',
            })
            .done(() => this.restart())
            .fail(() => {
                // Bei der Fehlerbehandlung ist noch Potential
                alert('Da ist leider etwas schief gegangen');
            });
    }

    private save(): void {
        if (this.seriesIdentifier == null)
            return;

        var newData = this.createUpdate();

        // Vorsichtshalbe schauen wir noch einmal nach, ob das alles so in Ordnung geht
        if (!this.validate(newData))
            return;

        var url = 'movie/series';
        if (!this.seriesIdentifier)
            url += '/' + newData.id;

        $
            .ajax(url, {
                type: this.seriesIdentifier ? 'POST' : 'PUT',
                contentType: 'application/json; charset=utf-8',
                data: JSON.stringify(newData),
            })
            .done(() => this.restart())
            .fail(() => {
                // Bei der Fehlerbehandlung ist noch Potential
                alert('Da ist leider etwas schief gegangen');
            });
    }

    // Alles was jetzt kommt sind eigentlich die abstrakten Methoden der Basisklasse

    private dialog(): JQuery {
        return $('#seriesEditDialog');
    }

    private chooser(): JQuery {
        return this.dialog().find('.selectKey');
    }

    private parentChooser(): JQuery {
        return this.dialog().find('.editParent');
    }

    private saveButton(): JQuery {
        return this.dialog().find('.dialogSave');
    }

    private deleteButton(): JQuery {
        return this.dialog().find('.dialogDelete');
    }

    private cancelButton(): JQuery {
        return this.dialog().find('.dialogCancel');
    }

    private nameField(): JQuery {
        return this.dialog().find('.editKey');
    }

    private descriptionField(): JQuery {
        return this.dialog().find('.editName');
    }

    private validateName(newData: ISeriesMappingContract): string {
        return null;
    }

    private validateDescription(newData: ISeriesMappingContract): string {
        return null;
    }
}

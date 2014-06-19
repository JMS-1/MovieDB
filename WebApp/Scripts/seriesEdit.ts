/// <reference path='typings/jquery/jquery.d.ts' />
/// <reference path='typings/jqueryui/jqueryui.d.ts' />
/// <reference path='interfaces.ts' />

class SeriesEditor {
    constructor(openButtonSelector: string, reloadApplicationData: () => void, getChildren: (series: string) => ISeriesMappingContract[]) {
        this.reload = reloadApplicationData;
        this.getChildren = getChildren;

        $(openButtonSelector).click(() => this.open());

        this.dialogContent = this.dialog().html();
        this.dialog().empty();
    }

    private reload: () => void;

    private getChildren: (series: string) => ISeriesMappingContract[];

    private seriesIdentifier: string = null;

    private confirmedDelete: DeleteButton;

    private dialogContent: string;

    private series: ISeriesMappingContract[];

    private open(): void {
        this.dialog().html(this.dialogContent);

        $('.navigationButton, .editButton').button();

        Tools.fillSeriesSelection(this.chooser(), this.series, '(Neue Serie anlegen)');
        Tools.fillSeriesSelection(this.parentChooser(), this.series, '(Keine)');

        this.confirmedDelete = new DeleteButton(this.dialog().find('.dialogDelete'), () => this.remove());

        this.saveButton().click(() => this.save());
        this.cancelButton().click(() => this.close());

        this.descriptionField().on('change', () => this.validate());
        this.descriptionField().on('input', () => this.validate());
        this.nameField().on('change', () => this.validate());
        this.nameField().on('input', () => this.validate());
        this.parentChooser().change(() => this.validate());
        this.chooser().change(() => this.choose());

        this.chooser().val('');
        this.choose();

        Tools.openDialog(this.dialog());
    }

    private close() {
        this.dialog().dialog('close');
        this.dialog().empty();
    }

    private restart(): void {
        this.close();

        // Wichtig ist, dass wir die neuen Listen in die Oberfläche laden
        this.reload();
    }

    private createUpdate(): ISeriesContract {
        var newData: ISeriesContract =
            {
                parentId: this.parentChooser().val(),
                name: (this.nameField().val() || '').trim(),
                description: (this.descriptionField().val() || '').trim(),
            };

        return newData;
    }

    reset(list: ISeriesMappingContract[]): void {
        this.series = list;
    }

    private validate(newData: ISeriesContract = null): boolean {
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
        this.confirmedDelete.disable();

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

            $.ajax('movie/series/' + choosen).done((info: ISeriesEditInfoContract) => {
                if (info == null)
                    return;

                this.seriesIdentifier = info.id;

                this.nameField().val(info.name);
                this.descriptionField().val(info.description);
                this.parentChooser().val(info.parentId);

                if (info.unused)
                    this.confirmedDelete.enable();

                // Für den unwahrscheinlichen Fall, dass sich die Spielregeln verändert haben - und um die Schaltfläche zum Speichern zu aktivieren
                this.validate();
            });
        }
    }

    private remove(): void {
        if (this.seriesIdentifier == null)
            return;
        if (this.seriesIdentifier.length < 1)
            return;

        $
            .ajax('movie/series/' + this.seriesIdentifier, {
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
        var series = this.seriesIdentifier;
        if (series.length > 0)
            url += '/' + series;

        $
            .ajax(url, {
                type: (series.length < 1) ? 'POST' : 'PUT',
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

    private cancelButton(): JQuery {
        return this.dialog().find('.dialogCancel');
    }

    private nameField(): JQuery {
        return this.dialog().find('.editKey');
    }

    private descriptionField(): JQuery {
        return this.dialog().find('.editName');
    }

    private validateName(newData: ISeriesContract): string {
        var name = newData.name;

        if (name.length < 1)
            return 'Es muss ein Name angegeben werden';
        else if (name.length > 50)
            return 'Der Name darf maximal 50 Zeichen haben';
        else {
            var existingChildren = this.getChildren(newData.parentId);

            for (var i = 0; i < existingChildren.length; i++)
                if (existingChildren[i].name == name)
                    if (existingChildren[i].id != this.seriesIdentifier)
                        return 'Dieser Name wird bereits verwendet';

            return null;
        }
    }

    private validateDescription(newData: ISeriesContract): string {
        var description = newData.description;

        if (description.length > 2000)
            return 'Die Beschreibung darf maximal 2000 Zeichen haben';
        else
            return null;
    }
}

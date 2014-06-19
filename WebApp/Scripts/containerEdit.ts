﻿/// <reference path='typings/jquery/jquery.d.ts' />
/// <reference path='typings/jqueryui/jqueryui.d.ts' />
/// <reference path='interfaces.ts' />

class ContainerEditor {
    constructor(openButtonSelector: string, reloadApplicationData: () => void) {
        this.reload = reloadApplicationData;

        this.confirmedDelete = new DeleteButton(this.dialog().find('.dialogDelete'), () => this.remove());

        $(openButtonSelector).click(() => this.open());

        this.saveButton().click(() => this.save());
        this.cancelButton().click(() => this.close());

        this.descriptionField().on('change', () => this.validate());
        this.descriptionField().on('input', () => this.validate());
        this.nameField().on('change', () => this.validate());
        this.nameField().on('input', () => this.validate());
        this.parentChooser().change(() => this.validate());
        this.chooser().change(() => this.choose());
    }

    private reload: () => void;

    private getChildren: (series: string) => ISeriesMappingContract[];

    private containerName: string = null;

    private confirmedDelete: DeleteButton;

    private open(): void {
        // Vorher noch einmal schnell alles aufbereiten - eventuell erfolgt auch ein Aufruf an den Web Service
        this.choose();

        Tools.openDialog(this.dialog());
    }

    private close() {
        this.dialog().dialog('close');
    }

    private restart(): void {
        this.close();

        // Wichtig ist, dass wir die neuen Listen in die Oberfläche laden
        this.reload();
    }

    private createUpdate(): IContainerEditContract {
        var newData: IContainerEditContract =
            {
                description: (this.descriptionField().val() || '').trim(),
                location: (this.locationField().val() || '').trim(),
                name: (this.nameField().val() || '').trim(),
                parent: this.parentChooser().val(),
                type: this.typeField().val(),
            };

        return newData;
    }

    reset(list: IContainerContract[]): void {
        Tools.fillMappingSelection(this.chooser(), list, '(Neue Aufbewahrung anlegen)');
        Tools.fillMappingSelection(this.parentChooser(), list, '(Keine)');
    }

    private validate(newData: IContainerEditContract = null): boolean {
        if (newData == null)
            newData = this.createUpdate();

        var isValid = true;

        if (Tools.setError(this.nameField(), this.validateName(newData)))
            isValid = false;
        if (Tools.setError(this.descriptionField(), this.validateDescription(newData)))
            isValid = false;
        if (Tools.setError(this.locationField(), this.validateLocation(newData)))
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
        this.locationField().val('');
        this.typeField().val('0');

        if (choosen.length < 1) {
            // Einfach ist es, wenn wir etwas neu Anlegen
            this.containerName = '';

            this.validate();
        }
        else {
            // Ansonsten fragen wir den Web Service immer nach dem neuesten Stand
            this.containerName = null;

            $.ajax('movie/container/?name=' + encodeURIComponent(choosen)).done((info: IContainerEditInfoContract) => {
                if (info == null)
                    return;

                this.containerName = info.name;

                this.descriptionField().val(info.description);
                this.typeField().val(info.type.toString());
                this.locationField().val(info.location);
                this.parentChooser().val(info.parent);
                this.nameField().val(info.name);

                this.confirmedDelete.enable();

                // Für den unwahrscheinlichen Fall, dass sich die Spielregeln verändert haben - und um die Schaltfläche zum Speichern zu aktivieren
                this.validate();
            });
        }
    }

    private remove(): void {
        if (this.containerName == null)
            return;
        if (this.containerName.length < 1)
            return;

        var newData = this.createUpdate();

        $
            .ajax('movie/container?name=' + encodeURIComponent(this.containerName), {
                type: 'DELETE',
            })
            .done(() => this.restart())
            .fail(() => {
                // Bei der Fehlerbehandlung ist noch Potential
                alert('Da ist leider etwas schief gegangen');
            });
    }

    private save(): void {
        if (this.containerName == null)
            return;

        var newData = this.createUpdate();

        // Vorsichtshalbe schauen wir noch einmal nach, ob das alles so in Ordnung geht
        if (!this.validate(newData))
            return;

        var url = 'movie/container';
        var container = this.containerName;
        if (container.length > 0)
            url += '/?name=' + encodeURIComponent(container);

        $
            .ajax(url, {
                type: (container.length < 1) ? 'POST' : 'PUT',
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
        return $('#containerEditDialog');
    }

    private chooser(): JQuery {
        return this.dialog().find('.selectName');
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
        return this.dialog().find('.editName');
    }

    private descriptionField(): JQuery {
        return this.dialog().find('.editDescription');
    }

    private typeField(): JQuery {
        return this.dialog().find('.chooseType');
    }

    private locationField(): JQuery {
        return this.dialog().find('.editLocation');
    }

    private validateName(newData: IContainerEditContract): string {
        var name = newData.name;

        if (name.length < 1)
            return 'Es muss ein Name angegeben werden';
        else if (name.length > 50)
            return 'Der Name darf maximal 50 Zeichen haben';
        else
            return null;
    }

    private validateDescription(newData: IContainerEditContract): string {
        var description = newData.description;

        if (description.length > 2000)
            return 'Der Standort darf maximal 2000 Zeichen haben';
        else
            return null;
    }

    private validateLocation(newData: IContainerEditContract): string {
        var location = newData.location;

        if (location.length > 100)
            return 'Der Position in der übergeordnete Aufzeichnung darf maximal 100 Zeichen haben';
        else
            return null;
    }
}


class LinkEditor {
    constructor(openButtonSelector: string, recordingAccessor: () => RecordingEditor) {
        this.recording = recordingAccessor;

        this.confirmedDelete = new DeleteButton(this.dialog().find('.dialogDelete'), () => this.remove());

        $(openButtonSelector).click(() => this.open());

        this.saveButton().click(() => this.save());
        this.cancelButton().click(() => this.close());

        this.descriptionField().on('change', () => this.validate());
        this.descriptionField().on('input', () => this.validate());
        this.nameField().on('change', () => this.validate());
        this.nameField().on('input', () => this.validate());
        this.urlField().on('change', () => this.validate());
        this.urlField().on('input', () => this.validate());
    }

    private static urlPattern = /http[s]?:\/\/(\w+:{0,1}\w*@)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-\/]))?/;

    private recording: () => RecordingEditor;

    private identifier: string = null;

    private confirmedDelete: DeleteButton;

    private linkMap: any = {};

    private open(): void {
        var recording = this.recording();
        var links = recording.viewToModel().links;

        this.linkMap = {};

        $.each(links, (index, link) => this.linkMap[link.name] = link);

        Tools.fillSelection(this.chooser(), links, '(Neuen Verweis anlegen)', i => i.name, i=> i.name);

        Tools.openDialog(this.dialog());

        this.validate();
    }

    private viewToModel(): ILinkEditContract {
        var contract: ILinkEditContract =
            {
                description: (this.descriptionField().val() || '').trim(),
                name: (this.nameField().val() || '').trim(),
                url: (this.urlField().val() || '').trim(),
            };

        return contract;
    }

    private close() {
        this.dialog().dialog('close');
    }

    private validate(newData: ILinkEditContract = null): boolean {
        if (newData == null)
            newData = this.viewToModel();

        var isValid = true;

        if (Tools.setError(this.nameField(), this.validateName(newData)))
            isValid = false;
        if (Tools.setError(this.urlField(), this.validateLink(newData)))
            isValid = false;
        if (Tools.setError(this.descriptionField(), this.validateDescription(newData)))
            isValid = false;

        this.saveButton().button('option', 'disabled', !isValid);

        return isValid;
    }

    private remove(): void {
    }

    private save(): void {
    }

    private dialog(): JQuery {
        return $('#linkEditDialog');
    }

    private chooser(): JQuery {
        return this.dialog().find('.selectName');
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

    private urlField(): JQuery {
        return this.dialog().find('.editLink');
    }

    private descriptionField(): JQuery {
        return this.dialog().find('.editDescription');
    }

    private validateName(newData: ILinkEditContract): string {
        var name = newData.name;

        if (name.length < 1)
            return 'Es muss ein Name angegeben werden';
        else if (name.length > 100)
            return 'Der Name darf maximal 100 Zeichen haben';
        else
            return null;
    }

    private validateLink(newData: ILinkEditContract): string {
        var link = newData.url;

        if (link.length < 1)
            return 'Es muss ein Verweis angegeben werden';
        else if (link.length > 2000)
            return 'Der Verweis darf maximal 2000 Zeichen haben';
        else if (!LinkEditor.urlPattern.test(link))
            return 'Der Verweis ist ungültig';
        else
            return null;
    }

    private validateDescription(newData: ILinkEditContract): string {
        var description = newData.description;

        if (description.length > 2000)
            return 'Die Beschreibung darf maximal 2000 Zeichen haben';
        else
            return null;
    }
}

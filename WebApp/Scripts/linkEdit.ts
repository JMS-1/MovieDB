
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
        this.chooser().change(() => this.choose());
    }

    static urlPattern = new RegExp(".{2001}");

    private recording: () => RecordingEditor;

    private identifier: string = null;

    private confirmedDelete: DeleteButton;

    private links: ILinkEditContract[] = [];

    private open(): void {
        this.links = this.recording().links();

        Tools.fillSelection(this.chooser(), this.links, '(Neuen Verweis anlegen)', i => i.name, i=> i.name);

        Tools.openDialog(this.dialog());

        this.choose();
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

    private close(): void {
        this.dialog().dialog('close');
    }

    private choose(): void {
        var selected = this.chooser().val();
        var link: ILinkEditContract = null;

        if (selected != '')
            for (var i = 0; i < this.links.length; i++)
                if (this.links[i].name == selected) {
                    link = this.links[i];

                    break;
                }

        if (link == null) {
            this.confirmedDelete.disable();
            this.descriptionField().val('');
            this.nameField().val('');
            this.urlField().val('');
        }
        else {
            this.confirmedDelete.enable();
            this.descriptionField().val(link.description);
            this.nameField().val(link.name);
            this.urlField().val(link.url);
        }

        this.validate();
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
        var selected = this.chooser().val();
        if (selected == '')
            return;

        for (var i = 0; i < this.links.length; i++)
            if (this.links[i].name == selected) {
                this.links.splice(i, 1);

                break;
            }

        this.recording().links(this.links);
        this.close();
    }

    private save(): void {
        var newData = this.viewToModel();

        if (!this.validate(newData))
            return;

        var selected = this.chooser().val();

        if (selected == '')
            this.links.push(newData);
        else for (var i = 0; i < this.links.length; i++)
            if (this.links[i].name == selected) {
                this.links[i] = newData;

                break;
            }

        this.recording().links(this.links);
        this.close();
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

        var chooser = this.chooser();
        var selected = chooser.val();
        if (selected == name)
            return null;

        if (this.links.some(l => l.name == name))
            return 'Der Name muss eindeutig sein';
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


class Styles {
    static invisble = 'invisible';

    static loading = 'ui-icon-power';

    static busy = 'ui-icon-refresh';

    static idle = 'ui-icon-check';

    static expanded = 'ui-icon-triangle-1-s';

    static collapsed = 'ui-icon-triangle-1-e';

    static pageButton = 'pageButton';

    static activePageButton = 'pageButtonSelected';

    static notSorted = 'ui-icon-arrowthick-2-n-s';

    static sortedUp = 'ui-icon-arrowthick-1-n';

    static sortedDown = 'ui-icon-arrowthick-1-s';

    static inputError = 'validationError';

    static deleteConfirmation = 'deleteConfirm';

    static treeNode = 'treeNode';

    static treeItem = 'treeItem';

    static nodeHeader = 'treeNodeHeader';

    static selectedNode = 'nodeSelected';

    static accordionSettings: JQueryUI.AccordionOptions = {
        active: false,
        animate: false,
        collapsible: true,
        heightStyle: 'content',
    };
}

class Tools {
    static setError(field: JQuery, message: string): boolean {
        if (message == null) {
            field.removeClass(Styles.inputError);
            field.removeAttr('title');

            return false;
        }
        else {
            field.addClass(Styles.inputError);
            field.attr('title', message);

            return true;
        }
    }

    static fillMappingSelection(selector: JQuery, items: IMappingContract[], nullSelection: string): void {
        Tools.fillSelection(selector, items, nullSelection, item => item.id, item=> item.name);
    }

    static fillSeriesSelection(selector: JQuery, series: ISeriesMappingContract[], nullSelection: string): void {
        Tools.fillSelection(selector, series, nullSelection, s => s.id, s=> s.hierarchicalName);
    }

    static fillSelection<T>(selector: JQuery, items: T[], nullSelection: string, getValue: (item: T) => string, getText: (item: T) => string): void {
        selector.empty();

        $('<option />', { text: nullSelection, value: '' }).appendTo(selector);

        $.each(items, (index, item) => $('<option />', { text: getText(item), value: getValue(item) }).appendTo(selector));
    }

    static checkCollision(selector: JQuery, name: string, identifier: string): boolean {
        var existing = selector.find('option');

        for (var i = 1; i < existing.length; i++)
            if (existing[i].innerHTML == name)
                if (existing[i].getAttribute('value') != identifier)
                    return true;

        return false;
    }

    static openDialog(dialog: JQuery): void {
        dialog.dialog({
            position: { of: '#main', at: 'center top+100', my: 'center top' },
            closeOnEscape: true,
            width: 'auto',
            modal: true,
        });
    }

    // Erstellt das Standardeinzeigeformat für ein Datum mit Uhrzeit.
    static toFullDateWithTime(dateTime: Date): string {
        // Eine zweistellig Zahl erzeugen
        var formatNumber = (val: number) => (val < 10) ? ('0' + val.toString()) : val.toString();

        return formatNumber(dateTime.getDate()) + '.' + formatNumber(1 + dateTime.getMonth()) + '.' + dateTime.getFullYear().toString() + ' ' + formatNumber(dateTime.getHours()) + ':' + formatNumber(dateTime.getMinutes()) + ':' + formatNumber(dateTime.getSeconds());
    }
}

class MultiValueEditor<T extends IMappingContract> {
    constructor(containerSelector: string, onChange: () => void) {
        this.onChange = onChange;

        this.container = $(containerSelector);
    }

    private static idCounter = 0;

    private onChange: () => void;

    container: JQuery;

    val(): string[];

    val(newVal: string[]): void;

    val(newVal?: string[]): string[] {
        if (newVal) {
            var map = {};
            $.each(newVal, (index, id) => map[id] = true);

            $.each(this.container.find('input[type=checkbox]'), (index, checkbox: HTMLInputElement) => {
                var selector = $(checkbox);

                selector.prop('checked', map[selector.val()] == true).button('refresh');
            });

            return newVal;
        } else {
            var value: string[] = [];

            $.each(this.container.find('input[type=checkbox]:checked'), (index, checkbox: HTMLInputElement) => value.push($(checkbox).val()));

            return value;
        }
    }

    reset(items: T[]): void {
        // Zuerst merken wir uns mal die aktuelle Einstellung
        var previousValue = this.val();

        // Dann wird die Oberfläche zurück gesetzt
        this.container.empty();

        // Und ganz neu aufgebaut
        $.each(items, (index, item) => {
            var id = "mve" + (++MultiValueEditor.idCounter);

            var checkbox = $('<input />', { type: 'checkbox', id: id, value: item.id }).appendTo(this.container).click(() => this.onChange());
            var label = $('<label />', { 'for': id, text: item.name }).appendTo(this.container);

            checkbox.button();
        });

        // Alle Werte, die wir ausgewählt haben, werden wieder aktiviert - sofern sie bekannt sind
        this.val(previousValue);
    }
}

// Diese Basisklasse unterstützt die Pflege der festen Auswahllisten für Sprachen und Kategorien
class SuggestionListEditor<TInfoContract extends IEditInfoContract, TUpdateContext extends IMappingContract> {
    constructor(openButtonSelector: string, reloadApplicationData: () => void) {
        this.reload = reloadApplicationData;

        this.confirmedDelete = new DeleteButton(this.dialog().find('.dialogDelete'), () => this.remove());

        $(openButtonSelector).click(() => this.open());

        this.saveButton().click(() => this.save());
        this.cancelButton().click(() => this.close());

        this.nameField().on('change', () => this.validate());
        this.nameField().on('input', () => this.validate());
        this.chooser().change(() => this.choose());
    }

    private reload: () => void;

    private identifier: string = null;

    private confirmedDelete: DeleteButton;

    private open(): void {
        // Vorher noch einmal schnell alles aufbereiten
        this.chooser().val('');
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

    private createUpdate(): TUpdateContext {
        var newData: IMappingContract =
            {
                name: (this.nameField().val() || '').trim(),
                id: null,
            };

        // Der Downcast ist etwas unsauber, aber wir wissen hier genau, was wir tun
        return <TUpdateContext>newData;
    }

    reset(list: TUpdateContext[]): void {
        Tools.fillSelection(this.chooser(), list, this.createNewOption(), i => i.id, i=> i.name);
    }

    private validate(newData: TUpdateContext = null): boolean {
        if (newData == null)
            newData = this.createUpdate();

        var isValid = true;

        var nameError = this.validateName(newData)
        if (nameError == null)
            if (Tools.checkCollision(this.chooser(), newData.name, this.identifier))
                nameError = "Der Name wird bereits verwendet";

        if (Tools.setError(this.nameField(), nameError))
            isValid = false;

        this.saveButton().button('option', 'disabled', !isValid);

        return isValid;
    }

    private choose(): void {
        // Die aktuelle Auswahl ermitteln
        var choosen: string = this.chooser().val();

        // Und dann ganz defensiv erst einmal alles zurück setzen
        this.saveButton().button('option', 'disabled', true);
        this.confirmedDelete.disable();

        this.nameField().val('');

        if (choosen.length < 1) {
            // Einfach ist es, wenn wir etwas neu Anlegen
            this.identifier = '';

            this.validate();
        }
        else {
            // Ansonsten fragen wir den Web Service immer nach dem neuesten Stand
            this.identifier = null;

            $.ajax('movie/' + this.controllerName() + '/' + choosen).done((info: TInfoContract) => {
                if (info == null)
                    return;

                this.identifier = info.id;
                this.nameField().val(info.name);

                // Einträge der Voschlaglisten dürfen nur gelöscht werden, wenn sie nicht in Verwendung sind
                if (info.unused)
                    this.confirmedDelete.enable();

                // Für den unwahrscheinlichen Fall, dass sich die Spielregeln verändert haben - und um die Schaltfläche zum Speichern zu aktivieren
                this.validate();
            });
        }
    }

    private remove(): void {
        if (this.identifier == null)
            return;
        if (this.identifier.length < 1)
            return;

        $.ajax('movie/' + this.controllerName() + '/' + this.identifier, { type: 'DELETE' })
            .done(() => this.restart())
            .fail(() => alert('Da ist leider etwas schief gegangen'));
    }

    private save(): void {
        if (this.identifier == null)
            return;

        var newData = this.createUpdate();

        // Vorsichtshalbe schauen wir noch einmal nach, ob das alles so in Ordnung geht
        if (!this.validate(newData))
            return;

        var url = 'movie/' + this.controllerName();
        if (this.identifier.length > 0)
            url += '/' + this.identifier;

        $.ajax(url, {
            type: (this.identifier.length > 0) ? 'PUT' : 'POST',
            contentType: 'application/json; charset=utf-8',
            data: JSON.stringify(newData),
        })
            .done(() => this.restart())
            .fail(() => alert('Da ist leider etwas schief gegangen'));
    }

    private chooser(): JQuery {
        return this.dialog().find('.selectKey');
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

    // Alles was jetzt kommt sind eigentlich die abstrakten Methoden der Basisklasse

    controllerName(): string {
        throw 'Bitte controllerName implementieren';
    }

    createNewOption(): string {
        throw 'Bitte createNewOption implementieren';
    }

    dialog(): JQuery {
        throw 'Bitte dialog implementieren';
    }

    validateName(newData: TUpdateContext): string {
        throw 'Bitte validateName implementieren';
    }
}

// Beim Löschen verzichten wir auf eine explizite Rückfrage sondern erzwingen einfach das
// doppelte Betätigung der Schaltfläche nach einem visuellen Feedback mit dem ersten Drücken.
class DeleteButton {
    public constructor(button: JQuery, process: () => void) {
        this.button = button.click(() => this.remove());
        this.process = process;
    }

    private button: JQuery;

    private process: () => void;

    disable(): void {
        this.button.removeClass(Styles.deleteConfirmation);
        this.button.removeAttr('title');
        this.button.button('option', 'disabled', true);
    }

    enable(): void {
        this.button.button('option', 'disabled', false);
    }

    private remove(): void {
        if (this.button.hasClass(Styles.deleteConfirmation))
            this.process();
        else {
            this.button.addClass(Styles.deleteConfirmation);
            this.button.attr('title', 'Noch einmal Drücken zum unwiederruflichen Löschen');
        }
    }
}
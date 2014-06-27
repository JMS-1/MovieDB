
class Styles {
    static invisble = 'invisible';

    static loading = 'ui-icon-power';

    static busy = 'ui-icon-refresh';

    static idle = 'ui-icon-check';

    static expanded = 'ui-icon-circlesmall-minus';

    static collapsed = 'ui-icon-circlesmall-plus';

    static pageButton = 'pageButton';

    static activePageButton = 'pageButtonSelected';

    static disabledOption = 'disabledOption';

    static notSorted = 'ui-icon-arrowthick-2-n-s';

    static sortedUp = 'ui-icon-arrowthick-1-n';

    static sortedDown = 'ui-icon-arrowthick-1-s';

    static inputError = 'validationError';

    static deleteConfirmation = 'deleteConfirm';

    static treeNode = 'treeNode';

    static nodeHeader = 'treeNodeHeader';

    static isNode = 'nodeInTree';

    static isLeaf = 'leafInTree';

    static treeItem = 'treeItem';

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
            closeOnEscape: false,
            width: 'auto',
            modal: true,
        });
    }
}

class SeriesSelectors {
    container: JQuery;

    constructor(containerSelector: string) {
        this.container = $(containerSelector);
    }

    resetFilter(): void {
        this.container.val(null);
    }

    initialize(series: ISeriesMappingContract[]): void {
        Tools.fillSeriesSelection(this.container, series, '(egal)');
    }
}

// Bietet die Hierarchie der Serien zur Auswahl im Filter an
class SeriesTreeSelector {
    private static attributeId = 'data-id';

    private static attributeName = 'data-name';

    private whenChanged: (id: string, name: string) => void;

    private nextReset = 0;

    private search: string;

    private nodes: TreeController[] = [];

    constructor(private view: JQuery, onChanged: (id: string, name: string) => void) {
        this.view.keypress(ev => this.onKeyPressed(ev));
        this.whenChanged = onChanged;
    }

    // Ein Tastendruck führt im allgemeinen dazu, dass sich die Liste auf den ersten Eintrag mit einem passenden Namen verschiebt
    private onKeyPressed(ev: JQueryEventObject): void {
        // Tasten innerhalb eines Zeitraums von einer Sekunde werden zu einem zu vergleichenden Gesamtpräfix zusammengefasst
        var now = $.now();
        if (now >= this.nextReset)
            this.search = '';

        this.search = (this.search + ev.char).toLowerCase();
        this.nextReset = now + 1000;

        // Wir suchen erst einmal nur nach den Namen auf der obersten Ebene, das sollte für fast alles reichen
        for (var i = 0; i < this.nodes.length; i++) {
            var node = this.nodes[i];
            var name = node.model.fullName;

            // Der Vergleich ist wirklich etwas faul und dient wirklich nur zum grob anspringen
            if (name.length >= this.search.length)
                if (name.substr(0, this.search.length).toLowerCase() == this.search) {
                    this.scrollTo(node, []);

                    ev.preventDefault();

                    return;
                }
        }
    }

    // Wenn das jQuery UI Accordion geöffnet wirde, müssen wir irgendwie einen sinnvollen Anfangszustand herstellen
    activate(): void {
        this.view.focus();
        this.nextReset = 0;

        this.scrollToSelected();
    }

    // Stellt sicher, dass die aktuell ausgewählte Serie ganz oben angezeigt wird
    private scrollToSelected(): void {
        $.each(this.nodes, (index, node) => node.foreachSelected((target, path) => this.scrollTo(target, path), null));
    }

    // Stellt sicher, dass eine beliebige Serie ganz oben dargestellt wird
    private scrollTo(selected: TreeController, path: TreeNodeController[]): void {
        // Wir klappen den Baum immer bis zur Auswahl auf
        $.each(path, (index, node) => node.nodeModel.expanded.val(true));

        // Und dann verschieben wir das Sichtfenster so, dass die ausgewählte Serie ganz oben steht - ja, das kann man sicher eleganter machen
        if (path.length > 0)
            selected = path[0];

        var firstTop = this.view.children().first().offset().top;
        var selectedTop = selected.view.text.offset().top;

        this.view.scrollTop(selectedTop - firstTop);
    }

    // Hebt die aktuelle Auswahl auf
    resetFilter(allbut: TreeController = null): void {
        $.each(this.nodes, (index, node) => node.foreachSelected((target, path) => target.model.selected.val(false), allbut));
    }

    // Baut die Hierarchie der Serien auf
    initialize(series: ISeriesMapping[]): void {
        this.view.empty();

        this.nodes = SeriesTreeSelector.buildTree(series.filter(s => s.parentId == null), this.view);

        $.each(this.nodes, (index, node) => node.click(target => this.itemClick(target)));
    }

    // Wird wärend der Änderung der Auswahl gesetzt
    private selecting = false;

    // Wird immer dann ausgelöst, wenn ein Knoten oder Blatt angeklick wurde
    private itemClick(target: TreeController): void {
        if (this.selecting)
            return;

        this.selecting = true;
        try {
            // In der aktuellen Implementierung darf immer nur eine einzige Serie ausgewählt werden
            this.resetFilter(target);

            var model = target.model;
            if (model.selected.val())
                this.whenChanged(model.id, model.fullName);
            else
                this.whenChanged(null, null);
        }
        finally {
            this.selecting = false;
        }
    }

    // Baut ausgehend von einer Liste von Geschwisterserien den gesamten Baum unterhalb dieser Serien auf
    private static buildTree(children: ISeriesMapping[], parent: JQuery): TreeController[] {
        return $.map(children, item => {
            // Blätter sind einfach
            if (item.children.length < 1)
                return new TreeLeafController(new TreeLeafModel(item), new TreeLeafView(item.name, item.parentId == null, parent));

            // Bei Knoten müssen wir etwas mehr tun
            var node = new TreeNodeController(new TreeNodeModel(item), new TreeNodeView(item.name, item.parentId == null, parent));

            // Für alle untergeordeneten Serien müssen wir eine entsprechende Anzeige vorbereiten
            node.children = this.buildTree(item.children, node.nodeView.childView);

            return <TreeController>node;
        });
    }
}

class MultiValueEditor<T extends IMappingContract> {
    constructor(containerSelector: string, onChange: () => void) {
        this.onChange = onChange;

        this.container = $(containerSelector);
        this.container.buttonset();
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

                selector.prop('checked', map[selector.val()] == true);
            });

            this.container.buttonset('refresh');

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
        });

        // Alle Werte, die wir ausgewählt haben, werden wieder aktiviert - sofern sie bekannt sind
        this.val(previousValue);
    }
}

// Diese Basisklasse unterstützt die Pflege der festen Auswahllisten für Sprachen und Arten von Aufzeichnungen
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
        // Vorher noch einmal schnell alles aufbereiten - eventuell erfolgt auch ein Aufruf an den Web Service
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
        this.saveButton().button('option', 'disabled', choosen.length > 0);

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

        $
            .ajax('movie/' + this.controllerName() + '/' + this.identifier, {
                type: 'DELETE',
            })
            .done(() => this.restart())
            .fail(() => {
                // Bei der Fehlerbehandlung ist noch Potential
                alert('Da ist leider etwas schief gegangen');
            });
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

        $
            .ajax(url, {
                type: (this.identifier.length < 1) ? 'POST' : 'PUT',
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

    controllerName(): string {
        throw 'Bitte controllerName implementieren';
    }

    createNewOption(): string {
        throw 'Bitte createNewOption implementieren';
    }

    dialog(): JQuery {
        throw 'Bitte dialog implementieren';
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

    validateName(newData: TUpdateContext): string {
        throw 'Bitte validateName implementieren';
    }
}

class DeleteButton {
    public constructor(button: JQuery, process: () => void) {
        this.button = button.click(() => this.remove());
        this.process = process;
    }

    private button: JQuery;

    private process: () => void;

    disable(): void {
        this.button.removeClass(Styles.deleteConfirmation);
        this.button.button('option', 'disabled', true);
    }

    enable(): void {
        this.button.button('option', 'disabled', false);
    }

    private remove(): void {
        if (this.button.hasClass(Styles.deleteConfirmation))
            this.process();
        else
            this.button.addClass(Styles.deleteConfirmation);
    }
}
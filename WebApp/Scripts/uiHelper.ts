
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

    private container: JQuery;

    private whenChanged: (id: string, name: string) => void;

    private nextReset = 0;

    private search: string;

    constructor(containerSelector: string, onChanged: (id: string, name: string) => void) {
        this.container = $(containerSelector).keypress(ev => this.onKeyPressed(ev));
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

        // Wir suchen hier nach dem vollständigen (hierarchischen) Namen, was uns in der ersten Version erlaubt, auf ein Aufklappen zu verzichten
        var nodes = this.container.find('[' + SeriesTreeSelector.attributeName + ']');
        for (var i = 0; i < nodes.length; i++) {
            var node = $(nodes[i]);
            var name = node.attr(SeriesTreeSelector.attributeName);
            if (name.length >= this.search.length)
                if (name.substr(0, this.search.length).toLowerCase() == this.search) {
                    this.scrollTo(node);

                    ev.preventDefault();

                    return;
                }
        }
    }

    // Wenn das jQuery UI Accordion geöffnet wirde, müssen wir irgendwie einen sinnvollen Anfangszustand herstellen
    activate(): void {
        this.container.focus();
        this.nextReset = 0;

        this.scrollToSelected();
    }

    // Ermittelt die aktuell ausgewählte Serie
    private selected(): JQuery {
        return this.container.find('.' + Styles.selectedNode);
    }

    // Wählt eine bestimmt Serie aus
    private selectNode(node: JQuery): void {
        var wasSelected = node.hasClass(Styles.selectedNode);

        this.resetFilter();

        // Die Änderung wird an unseren Chef gemeldet
        if (wasSelected)
            this.whenChanged(null, null);
        else {
            node.addClass(Styles.selectedNode);

            this.whenChanged(node.attr(SeriesTreeSelector.attributeId), node.attr(SeriesTreeSelector.attributeName));
        }
    }

    // Stellt sicher, dass die aktuell ausgewählte Serie ganz oben angezeigt wird
    private scrollToSelected(): void {
        this.scrollTo(this.selected());
    }

    // Stellt sicher, dass eine beliebige Serie ganz oben dargestellt wird
    private scrollTo(selected: JQuery): void {
        if (selected.length < 1)
            return;

        // Alles aufklappen, damit wir die Serie überhaupt sehen können
        for (var parent = selected.parent(); (parent.length == 1) && (parent[0] !== this.container[0]); parent = parent.parent()) {
            var toggle = parent.prev().children().first();
            if (toggle.hasClass(Styles.collapsed))
                toggle.removeClass(Styles.collapsed).addClass(Styles.expanded);

            parent.removeClass(Styles.invisble);
        }

        var firstTop = this.container.children().first().offset().top;
        var selectedTop = selected.offset().top;

        this.container.scrollTop(selectedTop - firstTop);
    }

    // Hebt die aktuelle Auswahl auf
    resetFilter(): void {
        this.selected().removeClass(Styles.selectedNode);
    }

    // Baut die Hierarchie der Serien auf
    initialize(series: ISeriesMapping[]): void {
        this.container.empty();

        this.buildTree(series.filter(s => s.parentId == null), this.container);
    }

    // Erzeugt einen Knoten oder ein Blatt für eine konkrete Serie
    private createNode(node: JQuery, item: ISeriesMapping, isLeaf: boolean): JQuery {
        // Zur Vereinfachung verwenden wir hier die fluent-API von jQuery
        return node

        // Angezeigt wird immer der relative Name der Serie
            .text(item.name)

        // Wir müssen uns aber auch die eindeutige Kennung der Serie zur Auswahl merken
            .attr(SeriesTreeSelector.attributeId, item.id)

        // Den vollständigen Namen der Serien setzen wird nur als visuelles Feedback ein
            .attr(SeriesTreeSelector.attributeName, item.hierarchicalName)

        // Für das Feintuning der Anzeige unterscheiden wir auch Knoten und Blätter
            .addClass(isLeaf ? Styles.isLeaf : Styles.isNode)

        // Der neue Knoten oder das neue Blatt kann zur Auswahl durch den Anwender angeklickt werden
            .on('click', () => this.selectNode(node));
    }

    // Baut ausgehend von einer Liste von Geschwisterserien den gesamten Baum unterhalb dieser Serien auf
    private buildTree(children: ISeriesMapping[], parent: JQuery): TreeController[] {
        return $.map(children, item => {
            // Blätter sind einfach
            if (item.children.length < 1)
                return new TreeLeafController(new TreeLeafModel(item), new TreeLeafView(item.name, item.parentId == null, parent));

            // Bei Knoten müssen wir etwas mehr tun
            var node = new TreeNodeController(new TreeNodeModel(item), new TreeNodeView(item.name, item.parentId == null, parent));

            // Für alle untergeordeneten Serien müssen wir eine entsprechende Anzeige vorbereiten
            node.children = this.buildTree(item.children, node.view.childView);

            return <TreeController>node;
        });
    }

    // Baut ausgehend von einer Liste von Geschwisterserien den gesamten Baum unterhalb dieser Serien auf
    private buildTree_old(children: ISeriesMapping[], parent: JQuery): void {
        $.each(children, (index, item) => {

            // Für jede Serie wird ein gesondertes Fragment erzeugt
            var child = $('<div />').appendTo(parent);

            // Die Wurzelserien werden nicht markiert, da diese Markierung für das relative Einrücken sorgt
            if (item.parentId != null)
                child.addClass(Styles.treeNode);

            // Blätter sind sehr einfach darzustellen, bei Knoten müssen wir etwas mehr tun
            if (item.children.length < 1) {
                this.createNode(child, item, true);
            } else {
                // Das kleine Symbol zum Auf- und Zuklappen muss auch noch rein
                var header =
                    $('<div />', { 'class': Styles.nodeHeader })
                        .appendTo(child);

                // Für die Unterserien wird ein eigener Container angelegt, den wir dann über dieses Symbol auf- und zuklappen
                var toggle =
                    $('<div />', { 'class': 'ui-icon' })
                        .addClass(Styles.collapsed)
                        .appendTo(header);

                // Nun kann der Name der Serie zum Anklicken eingeblendet werden
                this.createNode($('<div />'), item, false).appendTo(header);

                // Dann erst die Unterserien
                var childContainer = $('<div />', { 'class': Styles.invisble }).appendTo(child);

                // Und wir müssen natürlich nicht auf die Änderung reagieren
                toggle.on('click', ev => {
                    if (ev.currentTarget !== ev.target)
                        return;

                    // Auf- oder Zuklappen, je nach aktuellem Zustand
                    if (toggle.hasClass(Styles.expanded)) {
                        toggle.removeClass(Styles.expanded);
                        toggle.addClass(Styles.collapsed);

                        childContainer.addClass(Styles.invisble);
                    }
                    else {
                        toggle.removeClass(Styles.collapsed);
                        toggle.addClass(Styles.expanded);

                        childContainer.removeClass(Styles.invisble);
                    }
                });

                // Nun alle unsere Unterserien
                this.buildTree(item.children, childContainer);
            }

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
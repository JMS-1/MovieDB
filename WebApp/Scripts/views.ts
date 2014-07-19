
// Ein einzelne Option einer Alternativauswahl
class RadioView {
    constructor(public model: IMappingContract, container: JQuery, optionGroupName: string) {
        var id = optionGroupName + this.model.id;

        this.radio = $('<input />', { type: 'radio', id: id, name: optionGroupName, value: this.model.id }).appendTo(container);
        this.label = $('<label />', { 'for': id, text: this.model.name }).appendTo(container);

        this.radio.button();
    }

    private radio: JQuery;

    private label: JQuery;

    reset(): void {
        if (this.model.id.length < 1)
            return;

        if (this.radio.prop('checked')) {
            this.label.removeClass(Styles.invisble);
            this.radio.removeClass(Styles.invisble);
        }
        else {
            this.label.addClass(Styles.invisble);
            this.radio.addClass(Styles.invisble);
        }
    }

    check(): void {
        this.radio.prop('checked', true).button('refresh');
    }

    setCount(count: number): void {
        this.radio.button('option', 'label', this.model.name + ' (' + count + ')');

        this.radio.removeClass(Styles.invisble);
        this.label.removeClass(Styles.invisble);
    }
}

// Eine einzelne Option einer Mehrfachauswahl
class CheckView {
    constructor(public model: IMappingContract, container: JQuery, onChange: () => void, groupName: string) {
        var id = groupName + this.model.id;

        this.checkbox = $('<input />', { type: 'checkbox', id: id, name: this.model.id }).appendTo(container).change(onChange);
        this.label = $('<label />', { 'for': id, text: this.model.name }).appendTo(container);

        this.checkbox.button();
    }

    private checkbox: JQuery;

    private label: JQuery;

    reset(): void {
        this.checkbox.button('option', 'label', this.model.name + ' (0)');
        this.checkbox.button('option', 'disabled', true);
    }

    isChecked(): boolean {
        return this.checkbox.prop('checked');
    }

    check(check: boolean): void {
        this.checkbox.prop('checked', check).button('refresh');
    }

    setCount(count: number): void {
        this.checkbox.button('option', 'label', this.model.name + ' (' + count + ')');
        this.checkbox.button('option', 'disabled', false);
    }
}

// Jedes Element in einem Baum wird durch einen Text in einem Oberflächenelement repräsentiert
class TreeItemView {
    // Das zugehörige Oberflächenelement
    view: JQuery;

    // Die Darstellung des eigentlichen Namens - technisch gesehen protected
    text: JQuery;

    // Wird ausgelöst, wenn der Name angeklickt wird
    click = () => { };

    constructor(container: JQuery, isRoot: boolean) {
        this.view = $('<div />').appendTo(container);

        if (!isRoot)
            this.view.addClass(Styles.treeNode);
    }

    // Gemeinsam ist allen Elementen auch, dass sie ausgewählt werden können und dies durch ein optisches Feedback anzeigen
    selected(isSelected: boolean): void {
        if (isSelected)
            this.text.addClass(Styles.selectedNode);
        else
            this.text.removeClass(Styles.selectedNode);
    }

    // Legt den Anzeigenamen fest
    setText(name: string, view: JQuery) {
        this.text = view.addClass(Styles.treeItem).text(name).click(() => this.click());
    }
}

// Ein Blatt zeigt im wesentlichen nur seinen Namen an
class TreeLeafView extends TreeItemView {
    constructor(name: string, isRoot: boolean, container: JQuery) {
        super(container, isRoot);

        this.setText(name, this.view);
    }
}

// Ein Knoten hat zusätzlich einen Bereich für Kindknoten, der zudem auf- und zugeklappt werden kann
class TreeNodeView extends TreeItemView {
    childView: JQuery;

    toggle = () => { };

    constructor(name: string, isRoot: boolean, container: JQuery) {
        super(container, isRoot);

        // Der Kopfbereich wird das Klappsymbol und den Namen enthalten
        var header = $('<div />', { 'class': Styles.nodeHeader }).appendTo(this.view);

        $('<div />', { 'class': 'ui-icon' }).click(() => this.toggle()).appendTo(header);

        this.setText(name, $('<div />').appendTo(header));

        // Der Kindbereich bleibt erst einmal leer
        this.childView = $('<div />').appendTo(this.view);
    }

    // Zeigt oder verbirgt die Unterstruktur
    expanded(isExpanded: boolean): void {
        var toggle = this.view.children().first().children().first();

        if (isExpanded) {
            toggle.removeClass(Styles.collapsed).addClass(Styles.expanded);

            this.childView.removeClass(Styles.invisble);
        }
        else {
            toggle.removeClass(Styles.expanded).addClass(Styles.collapsed);

            this.childView.addClass(Styles.invisble);
        }
    }
}
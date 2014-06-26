
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
        if (this.checkbox.prop('checked')) {
            this.label.removeClass(Styles.invisble);
            this.checkbox.removeClass(Styles.invisble);
        }
        else {
            this.label.addClass(Styles.invisble);
            this.checkbox.addClass(Styles.invisble);
        }
    }

    isChecked(): boolean {
        return this.checkbox.prop('checked');
    }

    check(check: boolean): void {
        this.checkbox.prop('checked', check).button('refresh');
    }

    setCount(count: number): void {
        this.checkbox.button('option', 'label', this.model.name + ' (' + count + ')');

        this.checkbox.removeClass(Styles.invisble);
        this.label.removeClass(Styles.invisble);
    }
}

// Ein Blatt in einem Baum

interface ITreeItemView {
    text(name: string): void;
}

class TreeLeafView implements ITreeItemView {
    private view: JQuery;

    constructor(container: JQuery) {
        this.view = $('<div />').appendTo(container);
    }

    text(name: string): void {
        this.view.text(name);
    }
}

class TreeNodeView implements ITreeItemView {
    private view: JQuery;

    constructor(container: JQuery) {
        this.view = $('<div />').appendTo(container);

        var header = $('<div />', { 'class': Styles.nodeHeader }).appendTo(this.view);

        $('<div />', { 'class': 'ui-icon ' + Styles.collapsed }).appendTo(header);
        $('<div />').appendTo(header);

        $('<div />', { 'class': Styles.invisble }).appendTo(this.view);
    }

    text(name: string): void {
        this.view.children().first().children().last().text(name);
    }
}
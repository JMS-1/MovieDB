var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
// Ein einzelne Option einer Alternativauswahl
var RadioView = (function () {
    function RadioView(model, container, optionGroupName) {
        this.model = model;
        var id = optionGroupName + this.model.id;
        this.radio = $('<input />', { type: 'radio', id: id, name: optionGroupName, value: this.model.id }).appendTo(container);
        this.label = $('<label />', { 'for': id, text: this.model.name }).appendTo(container);
        this.radio.button();
    }
    RadioView.prototype.reset = function () {
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
    };
    RadioView.prototype.check = function () {
        this.radio.prop('checked', true).button('refresh');
    };
    RadioView.prototype.setCount = function (count) {
        this.radio.button('option', 'label', this.model.name + ' (' + count + ')');
        this.radio.removeClass(Styles.invisble);
        this.label.removeClass(Styles.invisble);
    };
    return RadioView;
}());
// Eine einzelne Option einer Mehrfachauswahl
var CheckView = (function () {
    function CheckView(model, container, onChange, groupName) {
        this.model = model;
        var id = groupName + this.model.id;
        this.checkbox = $('<input />', { type: 'checkbox', id: id, name: this.model.id }).appendTo(container).change(onChange);
        this.label = $('<label />', { 'for': id, text: this.model.name }).appendTo(container);
        this.checkbox.button();
    }
    CheckView.prototype.reset = function () {
        this.checkbox.button('option', 'label', this.model.name + ' (0)');
        this.checkbox.button('option', 'disabled', true);
    };
    CheckView.prototype.isChecked = function () {
        return this.checkbox.prop('checked');
    };
    CheckView.prototype.check = function (check) {
        this.checkbox.prop('checked', check).button('refresh');
    };
    CheckView.prototype.setCount = function (count) {
        this.checkbox.button('option', 'label', this.model.name + ' (' + count + ')');
        this.checkbox.button('option', 'disabled', false);
    };
    return CheckView;
}());
// Jedes Element in einem Baum wird durch einen Text in einem Oberflächenelement repräsentiert
var TreeItemView = (function () {
    function TreeItemView(container, isRoot) {
        // Wird ausgelöst, wenn der Name angeklickt wird
        this.click = function () { };
        this.view = $('<div />').appendTo(container);
        if (!isRoot)
            this.view.addClass(Styles.treeNode);
    }
    // Gemeinsam ist allen Elementen auch, dass sie ausgewählt werden können und dies durch ein optisches Feedback anzeigen
    TreeItemView.prototype.selected = function (isSelected) {
        if (isSelected)
            this.text.addClass(Styles.selectedNode);
        else
            this.text.removeClass(Styles.selectedNode);
    };
    // Legt den Anzeigenamen fest
    TreeItemView.prototype.setText = function (name, view) {
        var _this = this;
        this.text = view.addClass(Styles.treeItem).text(name).click(function () { return _this.click(); });
    };
    return TreeItemView;
}());
// Ein Blatt zeigt im wesentlichen nur seinen Namen an
var TreeLeafView = (function (_super) {
    __extends(TreeLeafView, _super);
    function TreeLeafView(name, isRoot, container) {
        _super.call(this, container, isRoot);
        this.setText(name, this.view);
    }
    return TreeLeafView;
}(TreeItemView));
// Ein Knoten hat zusätzlich einen Bereich für Kindknoten, der zudem auf- und zugeklappt werden kann
var TreeNodeView = (function (_super) {
    __extends(TreeNodeView, _super);
    function TreeNodeView(name, isRoot, container) {
        var _this = this;
        _super.call(this, container, isRoot);
        this.toggle = function () { };
        // Der Kopfbereich wird das Klappsymbol und den Namen enthalten
        var header = $('<div />', { 'class': Styles.nodeHeader }).appendTo(this.view);
        $('<div />', { 'class': 'ui-icon' }).click(function () { return _this.toggle(); }).appendTo(header);
        this.setText(name, $('<div />').appendTo(header));
        // Der Kindbereich bleibt erst einmal leer
        this.childView = $('<div />').appendTo(this.view);
    }
    // Zeigt oder verbirgt die Unterstruktur
    TreeNodeView.prototype.expanded = function (isExpanded) {
        var toggle = this.view.children().first().children().first();
        if (isExpanded) {
            toggle.removeClass(Styles.collapsed).addClass(Styles.expanded);
            this.childView.removeClass(Styles.invisble);
        }
        else {
            toggle.removeClass(Styles.expanded).addClass(Styles.collapsed);
            this.childView.addClass(Styles.invisble);
        }
    };
    return TreeNodeView;
}(TreeItemView));
//# sourceMappingURL=views.js.map
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
        } else {
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
})();

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
        if (this.checkbox.prop('checked')) {
            this.label.removeClass(Styles.invisble);
            this.checkbox.removeClass(Styles.invisble);
        } else {
            this.label.addClass(Styles.invisble);
            this.checkbox.addClass(Styles.invisble);
        }
    };

    CheckView.prototype.isChecked = function () {
        return this.checkbox.prop('checked');
    };

    CheckView.prototype.check = function (check) {
        this.checkbox.prop('checked', check).button('refresh');
    };

    CheckView.prototype.setCount = function (count) {
        this.checkbox.button('option', 'label', this.model.name + ' (' + count + ')');

        this.checkbox.removeClass(Styles.invisble);
        this.label.removeClass(Styles.invisble);
    };
    return CheckView;
})();


var TreeLeafView = (function () {
    function TreeLeafView(container) {
        this.view = $('<div />').appendTo(container);
    }
    TreeLeafView.prototype.text = function (name) {
        this.view.text(name);
    };
    return TreeLeafView;
})();

var TreeNodeView = (function () {
    function TreeNodeView(container) {
        this.view = $('<div />').appendTo(container);

        var header = $('<div />', { 'class': Styles.nodeHeader }).appendTo(this.view);

        $('<div />', { 'class': 'ui-icon ' + Styles.collapsed }).appendTo(header);
        $('<div />').appendTo(header);

        $('<div />', { 'class': Styles.invisble }).appendTo(this.view);
    }
    TreeNodeView.prototype.text = function (name) {
        this.view.children().first().children().last().text(name);
    };
    return TreeNodeView;
})();
//# sourceMappingURL=views.js.map

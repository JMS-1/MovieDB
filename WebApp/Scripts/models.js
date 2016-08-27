var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
// Basisklasse für ein einfaches Modell mit nur einem Wert
var Model = (function () {
    function Model(initialValue) {
        this.onChange = [];
        this.value = initialValue;
    }
    // Hier kann sich ein Interessent an Änderungen des einzigen Wertes anmelden
    Model.prototype.change = function (callback) {
        if (callback != null)
            this.onChange.push(callback);
    };
    Model.prototype.onChanged = function () {
        $.each(this.onChange, function (index, callback) { return callback(); });
    };
    Model.prototype.val = function (newValue) {
        if (newValue === void 0) { newValue = undefined; }
        // Vielleicht will ja nur jemand den aktuellen Wert kennen lernen
        if (newValue !== undefined) {
            if (newValue != this.value) {
                this.value = newValue;
                // Wenn sich der Wert verändert hat, dann müssen wir alle Interessenten informieren
                this.onChanged();
            }
        }
        // Wir melden immer den nun aktuellen Wert
        return this.value;
    };
    return Model;
}());
// Ein Element in einer hierarchischen Ansicht kann ausgewählt werden
var TreeItemModel = (function () {
    function TreeItemModel(item) {
        this.selected = new Model(false);
        this.id = item.id;
        this.fullName = item.hierarchicalName;
    }
    return TreeItemModel;
}());
// Ein Blatt in einer hierarchischen Ansicht kann nur ausgewählt werden
var TreeLeafModel = (function (_super) {
    __extends(TreeLeafModel, _super);
    function TreeLeafModel(item) {
        _super.call(this, item);
    }
    return TreeLeafModel;
}(TreeItemModel));
// Ein Knoten in einer hierarchischen Ansicht kann zusätzlicher zur Auswahl auch auf- und zugeklappt werden
var TreeNodeModel = (function (_super) {
    __extends(TreeNodeModel, _super);
    function TreeNodeModel(item) {
        _super.call(this, item);
        this.expanded = new Model(false);
    }
    return TreeNodeModel;
}(TreeItemModel));
//# sourceMappingURL=models.js.map
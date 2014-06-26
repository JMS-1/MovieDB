﻿var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};

// Basisklasse für ein einfaches Modell mit nur einem Wert
var Model = (function () {
    function Model() {
        this.onChange = [];
        // Das wäre dann der einzige Wert
        this.value = null;
    }
    // Hier kann sich ein Interessent an Änderungen des einzigen Wertes anmelden
    Model.prototype.change = function (callback) {
        if (callback != null)
            this.onChange.push(callback);
    };

    Model.prototype.onChanged = function () {
        $.each(this.onChange, function (index, callback) {
            return callback();
        });
    };

    Model.prototype.val = function (newValue) {
        if (typeof newValue === "undefined") { newValue = undefined; }
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
})();

// Auswahl des Verleihers (verliehen / nicht verliehen / egal)
var RentFilterModel = (function (_super) {
    __extends(RentFilterModel, _super);
    function RentFilterModel() {
        _super.apply(this, arguments);
    }
    return RentFilterModel;
})(Model);

// Die Auswahl der Sprache (eindeutige Kennung / egal)
var LanguageFilterModel = (function (_super) {
    __extends(LanguageFilterModel, _super);
    function LanguageFilterModel() {
        _super.apply(this, arguments);
    }
    return LanguageFilterModel;
})(Model);

// Die Auswahl der Kategorien (Liste eindeutiger Kennungen)
var GenreFilterModel = (function (_super) {
    __extends(GenreFilterModel, _super);
    function GenreFilterModel() {
        _super.call(this);

        // Wir stellen sicher, dass immer ein (wenn auch leeres) Feld vorhanden ist
        _super.prototype.val.call(this, []);
    }
    return GenreFilterModel;
})(Model);

var TreeItemModel = (function () {
    function TreeItemModel() {
        this.isSelected = false;
        this.select = function () {
        };
    }
    TreeItemModel.prototype.selected = function (isSelected) {
        if (typeof isSelected === "undefined") { isSelected = undefined; }
        if (isSelected !== undefined)
            if (isSelected != this.isSelected) {
                this.isSelected = isSelected;

                this.select();
            }

        return this.isSelected;
    };
    return TreeItemModel;
})();

var TreeNodeModel = (function (_super) {
    __extends(TreeNodeModel, _super);
    function TreeNodeModel(data) {
        _super.call(this);
        this.isExpanded = false;
        this.changed = function () {
        };
    }
    TreeNodeModel.prototype.expanded = function (isExpanded) {
        if (typeof isExpanded === "undefined") { isExpanded = undefined; }
        if (isExpanded !== undefined)
            if (isExpanded != this.isExpanded) {
                this.isExpanded = isExpanded;

                this.changed();
            }

        return this.isExpanded;
    };
    return TreeNodeModel;
})(TreeItemModel);

var TreeLeafModel = (function (_super) {
    __extends(TreeLeafModel, _super);
    function TreeLeafModel(data) {
        _super.call(this);
    }
    return TreeLeafModel;
})(TreeItemModel);
//# sourceMappingURL=models.js.map

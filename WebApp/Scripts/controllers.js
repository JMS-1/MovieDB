var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
// Die Auswahl des Verleihers wird über drei separate Optionsfelder realisiert
var RentFilterController = (function () {
    function RentFilterController(view) {
        var _this = this;
        this.view = view;
        this.model = new RentFilterModel();
        this.view.accordion(Styles.accordionSettings).find('input').button().change(function () {
            return _this.viewToModel();
        });

        this.model.change(function () {
            return _this.modelToView();
        });

        this.modelToView();
    }
    RentFilterController.prototype.viewToModel = function () {
        var choice = this.view.find(':checked').val();
        if (choice.length < 1)
            this.model.val(null);
        else
            this.model.val(choice == '1');
    };

    RentFilterController.prototype.modelToView = function () {
        var val = this.model.val();
        var value = (val == null) ? '' : (val ? '1' : '0');

        this.view.find('input[value="' + value + '"]').prop('checked', true);
        this.view.find('input').button('refresh');

        if (val == null)
            this.view.find('.header').text('(egal)');
        else
            this.view.find('.header').text(val ? 'nur verliehene' : 'nur nicht verliehene');
    };
    return RentFilterController;
})();

// Beschreibt die Auswahl aus eine Liste von Alternativen
var RadioGroupController = (function () {
    function RadioGroupController(model, groupView, groupName) {
        var _this = this;
        this.model = model;
        this.groupView = groupView;
        this.groupName = groupName;
        this.radios = {};
        this.groupView.change(function () {
            return _this.viewToModel();
        });

        this.model.change(function () {
            return _this.modelToView();
        });
    }
    RadioGroupController.prototype.viewToModel = function () {
        this.model.val(this.val());
    };

    RadioGroupController.prototype.modelToView = function () {
        this.val(this.model.val());
    };

    RadioGroupController.prototype.initialize = function (models) {
        var _this = this;
        this.groupView.empty();
        this.radios = {};

        this.radios[''] = new RadioView({ id: '', name: '(egal)' }, this.groupView, this.groupName);

        $.each(models, function (index, model) {
            return _this.radios[model.id] = new RadioView(model, _this.groupView, _this.groupName);
        });

        this.val(null);
    };

    RadioGroupController.prototype.setCounts = function (statistics) {
        var _this = this;
        $.each(this.radios, function (key, stat) {
            return stat.reset();
        });
        $.each(statistics, function (index, stat) {
            return _this.radios[stat.id].setCount(stat.count);
        });
    };

    RadioGroupController.prototype.getName = function (id) {
        var radio = this.radios[id || ''];
        if (radio == null)
            return null;
        else
            return radio.model.name;
    };

    RadioGroupController.prototype.val = function (id) {
        if (typeof id === "undefined") { id = undefined; }
        if (id !== undefined) {
            var radio = this.radios[id || ''];
            if (radio != null)
                radio.check();
        }

        return this.groupView.find(':checked').val();
    };
    return RadioGroupController;
})();

// Beschreibt eine Mehrfachauswahl
var CheckGroupController = (function () {
    function CheckGroupController(model, container, groupName) {
        var _this = this;
        this.model = model;
        this.container = container;
        this.groupName = groupName;
        this.checks = {};
        this.model.change(function () {
            return _this.modelToView();
        });
    }
    CheckGroupController.prototype.initialize = function (models) {
        var _this = this;
        this.container.empty();
        this.checks = {};

        $.each(models, function (index, model) {
            return _this.checks[model.id] = new CheckView(model, _this.container, function () {
                return _this.viewToModel();
            }, _this.groupName);
        });
    };

    CheckGroupController.prototype.setCounts = function (statistics) {
        var _this = this;
        $.each(this.checks, function (key, check) {
            return check.reset();
        });
        $.each(statistics, function (index, check) {
            return _this.checks[check.id].setCount(check.count);
        });
    };

    CheckGroupController.prototype.getName = function (genre) {
        var check = this.checks[genre];
        if (check == null)
            return null;
        else
            return check.model.name;
    };

    CheckGroupController.prototype.viewToModel = function () {
        this.model.val(this.val());
    };

    CheckGroupController.prototype.modelToView = function () {
        this.val(this.model.val());
    };

    CheckGroupController.prototype.val = function (ids) {
        if (typeof ids === "undefined") { ids = undefined; }
        if (ids !== undefined) {
            var newValue = {};

            $.each(ids, function (index, id) {
                return newValue[id] = true;
            });

            for (var id in this.checks) {
                var check = this.checks[id];

                check.check(newValue[check.model.id] || false);
            }
        }

        var selected = [];

        for (var id in this.checks) {
            var check = this.checks[id];

            if (check.isChecked())
                selected.push(check.model.id);
        }

        return selected;
    };
    return CheckGroupController;
})();

// Die Auswahl der Sprache erfolgt durch eine Reihe von Alternativen
var LanguageFilterController = (function (_super) {
    __extends(LanguageFilterController, _super);
    function LanguageFilterController(view) {
        _super.call(this, new LanguageFilterModel(), view.find('.container'), 'languageChoice');
        this.view = view;

        this.view.accordion(Styles.accordionSettings);

        this.modelToView();
    }
    LanguageFilterController.prototype.modelToView = function () {
        _super.prototype.modelToView.call(this);

        this.view.find('.header').text(this.getName(this.model.val()) || '(egal)');
    };
    return LanguageFilterController;
})(RadioGroupController);

// Bei den Kategorien ist im Filter eine Mehrfachauswahl möglich
var GenreFilterController = (function (_super) {
    __extends(GenreFilterController, _super);
    function GenreFilterController(view) {
        _super.call(this, new GenreFilterModel(), view.find('.container'), 'genreCheckbox');
        this.view = view;

        this.view.accordion(Styles.accordionSettings);

        this.modelToView();
    }
    GenreFilterController.prototype.modelToView = function () {
        var _this = this;
        _super.prototype.modelToView.call(this);

        var genres = this.model.val();

        if (genres.length < 1)
            this.view.find('.header').text('(egal)');
        else
            this.view.find('.header').text($.map(genres, function (genre) {
                return _this.getName(genre);
            }).join(' und '));
    };
    return GenreFilterController;
})(CheckGroupController);

// Die Steuerung der Hierarchien
var TreeController = (function () {
    function TreeController() {
    }
    return TreeController;
})();

var TreeNodeController = (function (_super) {
    __extends(TreeNodeController, _super);
    function TreeNodeController(model, view) {
        var _this = this;
        _super.call(this);
        this.model = model;
        this.view = view;
        this.children = [];

        this.view.toggle = function () {
            return _this.model.expanded(!_this.model.expanded());
        };
        this.view.click = function () {
            return _this.model.selected(!_this.model.selected());
        };
        this.model.changed = function () {
            return _this.modelExpanded();
        };
        this.model.select = function () {
            return _this.modelSelected();
        };

        this.modelExpanded();
    }
    TreeNodeController.prototype.modelExpanded = function () {
        this.view.expanded(this.model.expanded());
    };

    TreeNodeController.prototype.modelSelected = function () {
        this.view.selected(this.model.selected());
    };
    return TreeNodeController;
})(TreeController);

var TreeLeafController = (function (_super) {
    __extends(TreeLeafController, _super);
    function TreeLeafController(model, view) {
        var _this = this;
        _super.call(this);
        this.model = model;
        this.view = view;

        this.view.click = function () {
            return _this.model.selected(!_this.model.selected());
        };
        this.model.select = function () {
            return _this.modelSelected();
        };
    }
    TreeLeafController.prototype.modelSelected = function () {
        this.view.selected(this.model.selected());
    };
    return TreeLeafController;
})(TreeController);
//# sourceMappingURL=controllers.js.map

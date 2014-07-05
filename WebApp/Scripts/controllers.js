var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
// Das Freitextfeld ist wirklich nur ein Textfeld, allerdings mit einer zeitgesteuerten automatischen Suche
var TextFilterController = (function () {
    function TextFilterController(view) {
        var _this = this;
        this.view = view;
        this.model = new Model(null);
        this.elapsed = function () {
        };
        // Gesetzt, wenn die automatische Suche nach der Eingabe eines Suchtextes aktiviert ist
        this.timeout = null;
        this.view.on('keypress', function () {
            return _this.viewToModel();
        });
        this.view.on('change', function () {
            return _this.viewToModel();
        });
        this.view.on('input', function () {
            return _this.viewToModel();
        });

        this.model.change(function () {
            return _this.modelToView();
        });

        this.modelToView();
    }
    TextFilterController.prototype.viewToModel = function () {
        var _this = this;
        this.stop();

        this.model.val(this.view.val());

        this.timeout = window.setTimeout(function () {
            return _this.elapsed();
        }, 300);
    };

    // Asynchrone automatische Suche deaktivieren
    TextFilterController.prototype.stop = function () {
        if (this.timeout != null)
            window.clearTimeout(this.timeout);

        this.timeout = null;
    };

    TextFilterController.prototype.modelToView = function () {
        var text = this.model.val();

        if (text !== this.view.val())
            this.view.val(text);
    };
    return TextFilterController;
})();

// Die Auswahl des Verleihers wird über drei separate Optionsfelder realisiert
var RentFilterController = (function () {
    function RentFilterController(view) {
        var _this = this;
        this.view = view;
        this.model = new Model(null);
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
            this.view.find('.ui-accordion-header>span').text('(egal)');
        else
            this.view.find('.ui-accordion-header>span').text(val ? 'nur verliehene' : 'nur nicht verliehene');
    };
    return RentFilterController;
})();

// Beschreibt die Auswahl aus eine Liste von Alternativen
var RadioGroupController = (function () {
    function RadioGroupController(groupView, groupName) {
        var _this = this;
        this.groupView = groupView;
        this.groupName = groupName;
        this.model = new Model(null);
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
        this.fillView(this.groupView, models);
    };

    RadioGroupController.prototype.fillView = function (view, models) {
        var _this = this;
        view.empty();

        this.radios = {};
        this.radios[''] = new RadioView({ id: '', name: '(egal)' }, view, this.groupName);

        $.each(models, function (index, model) {
            return _this.radios[model.id] = new RadioView(model, view, _this.groupName);
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
    function CheckGroupController(groupView, groupName) {
        var _this = this;
        this.groupView = groupView;
        this.groupName = groupName;
        this.model = new Model([]);
        this.checks = {};
        this.model.change(function () {
            return _this.modelToView();
        });
    }
    CheckGroupController.prototype.initialize = function (models) {
        this.fillView(this.groupView, models);
    };

    CheckGroupController.prototype.fillView = function (view, models) {
        var _this = this;
        view.empty();

        this.checks = {};

        $.each(models, function (index, model) {
            return _this.checks[model.id] = new CheckView(model, view, function () {
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
        _super.call(this, view, 'languageChoice');
        this.view = view;

        this.view.accordion(Styles.accordionSettings);

        this.modelToView();
    }
    LanguageFilterController.prototype.modelToView = function () {
        _super.prototype.modelToView.call(this);

        this.view.find('.ui-accordion-header>span').text(this.getName(this.model.val()) || '(egal)');
    };

    LanguageFilterController.prototype.initialize = function (models) {
        this.fillView(this.groupView.find('.ui-accordion-content'), models);
    };
    return LanguageFilterController;
})(RadioGroupController);

// Bei den Kategorien ist im Filter eine Mehrfachauswahl möglich
var GenreFilterController = (function (_super) {
    __extends(GenreFilterController, _super);
    function GenreFilterController(view) {
        _super.call(this, view, 'genreCheckbox');
        this.view = view;

        this.view.accordion(Styles.accordionSettings);

        this.modelToView();
    }
    GenreFilterController.prototype.modelToView = function () {
        var _this = this;
        _super.prototype.modelToView.call(this);

        var genres = this.model.val();

        if (genres.length < 1)
            this.view.find('.ui-accordion-header>span').text('(egal)');
        else
            this.view.find('.ui-accordion-header>span').text($.map(genres, function (genre) {
                return _this.getName(genre);
            }).join(' und '));
    };

    GenreFilterController.prototype.initialize = function (models) {
        this.fillView(this.groupView.find('.ui-accordion-content'), models);
    };
    return GenreFilterController;
})(CheckGroupController);

// Serien werden über einen Baum ausgewählt
var SeriesFilterController = (function () {
    function SeriesFilterController(view) {
        var _this = this;
        this.view = view;
        this.model = new Model(null);
        this.nextReset = 0;
        this.nodes = [];
        // Wird wärend der Änderung der Auswahl gesetzt
        this.selecting = false;
        this.view.accordion(Styles.accordionSettings).on('accordionactivate', function (event, ui) {
            if (ui.newPanel.length > 0)
                _this.activate();
        });

        this.container = this.view.find('.ui-accordion-content');
        this.container.keypress(function (ev) {
            return _this.onKeyPressed(ev);
        });
        this.model.change(function () {
            return _this.modelToView();
        });

        this.modelToView();
    }
    SeriesFilterController.prototype.modelToView = function () {
        var selected = this.model.val();
        var name = '(egal)';

        $.each(this.nodes, function (index, node) {
            return node.foreach(function (target) {
                if (target.model.selected.val(target.model.id == selected))
                    name = target.model.fullName;
            }, null);
        });

        this.view.find('.ui-accordion-header>span').text(name);
    };

    // Ein Tastendruck führt im allgemeinen dazu, dass sich die Liste auf den ersten Eintrag mit einem passenden Namen verschiebt
    SeriesFilterController.prototype.onKeyPressed = function (ev) {
        // Tasten innerhalb eines Zeitraums von einer Sekunde werden zu einem zu vergleichenden Gesamtpräfix zusammengefasst
        var now = $.now();
        if (now >= this.nextReset)
            this.search = '';

        this.search = (this.search + ev.char).toLowerCase();
        this.nextReset = now + 1000;

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
    };

    // Wenn das jQuery UI Accordion geöffnet wirde, müssen wir irgendwie einen sinnvollen Anfangszustand herstellen
    SeriesFilterController.prototype.activate = function () {
        var _this = this;
        this.container.focus();
        this.nextReset = 0;

        // Stellt sicher, dass die aktuell ausgewählte Serie ganz oben angezeigt wird
        $.each(this.nodes, function (index, node) {
            return node.foreach(function (target, path) {
                if (target.model.selected.val())
                    _this.scrollTo(target, path);
            }, null);
        });
    };

    // Stellt sicher, dass eine beliebige Serie ganz oben dargestellt wird
    SeriesFilterController.prototype.scrollTo = function (selected, path) {
        // Wir klappen den Baum immer bis zur Auswahl auf
        $.each(path, function (index, node) {
            return node.nodeModel.expanded.val(true);
        });

        // Und dann verschieben wir das Sichtfenster so, dass die ausgewählte Serie ganz oben steht - ja, das kann man sicher eleganter machen
        if (path.length > 0)
            selected = path[0];

        var firstTop = this.container.children().first().offset().top;
        var selectedTop = selected.view.text.offset().top;

        this.container.scrollTop(selectedTop - firstTop);
    };

    // Hebt die aktuelle Auswahl auf
    SeriesFilterController.prototype.resetFilter = function (allbut) {
        if (typeof allbut === "undefined") { allbut = null; }
        $.each(this.nodes, function (index, node) {
            return node.foreach(function (target, path) {
                return target.model.selected.val(false);
            }, allbut);
        });
    };

    // Baut die Hierarchie der Serien auf
    SeriesFilterController.prototype.initialize = function (series) {
        var _this = this;
        this.container.empty();

        this.nodes = SeriesFilterController.buildTree(series.filter(function (s) {
            return s.parentId == null;
        }), this.container);

        $.each(this.nodes, function (index, node) {
            return node.click(function (target) {
                return _this.itemClick(target);
            });
        });
    };

    // Wird immer dann ausgelöst, wenn ein Knoten oder Blatt angeklick wurde
    SeriesFilterController.prototype.itemClick = function (target) {
        if (this.selecting)
            return;

        this.selecting = true;
        try  {
            // In der aktuellen Implementierung darf immer nur eine einzige Serie ausgewählt werden
            this.resetFilter(target);

            var model = target.model;
            if (model.selected.val())
                this.model.val(model.id);
            else
                this.model.val(null);
        } finally {
            this.selecting = false;
        }
    };

    // Baut ausgehend von einer Liste von Geschwisterserien den gesamten Baum unterhalb dieser Serien auf
    SeriesFilterController.buildTree = function (children, parent) {
        var _this = this;
        return $.map(children, function (item) {
            // Blätter sind einfach
            if (item.children.length < 1)
                return new TreeLeafController(new TreeLeafModel(item), new TreeLeafView(item.name, item.parentId == null, parent));

            // Bei Knoten müssen wir etwas mehr tun
            var node = new TreeNodeController(new TreeNodeModel(item), new TreeNodeView(item.name, item.parentId == null, parent));

            // Für alle untergeordeneten Serien müssen wir eine entsprechende Anzeige vorbereiten
            node.children = _this.buildTree(item.children, node.nodeView.childView);

            return node;
        });
    };
    return SeriesFilterController;
})();

// Die Steuerung der Hierarchien
var TreeController = (function () {
    function TreeController(model, view) {
        this.model = model;
        this.view = view;
        this.selected = function (target) {
        };
    }
    TreeController.prototype.click = function (callback) {
        this.selected = callback;
    };

    TreeController.prototype.foreach = function (callback, allbut, path) {
        if (typeof path === "undefined") { path = []; }
        if (allbut !== this)
            callback(this, path);
    };
    return TreeController;
})();

var TreeNodeController = (function (_super) {
    __extends(TreeNodeController, _super);
    function TreeNodeController(nodeModel, nodeView) {
        var _this = this;
        _super.call(this, nodeModel, nodeView);
        this.nodeModel = nodeModel;
        this.nodeView = nodeView;
        this.children = [];

        this.nodeView.toggle = function () {
            return _this.nodeModel.expanded.val(!_this.nodeModel.expanded.val());
        };
        this.view.click = function () {
            return _this.nodeModel.selected.val(!_this.nodeModel.selected.val());
        };
        this.nodeModel.expanded.change(function () {
            return _this.modelExpanded();
        });
        this.nodeModel.selected.change(function () {
            return _this.modelSelected();
        });

        this.modelExpanded();
    }
    TreeNodeController.prototype.modelExpanded = function () {
        this.nodeView.expanded(this.nodeModel.expanded.val());
    };

    TreeNodeController.prototype.modelSelected = function () {
        this.view.selected(this.nodeModel.selected.val());
        this.selected(this);
    };

    TreeNodeController.prototype.click = function (callback) {
        _super.prototype.click.call(this, callback);

        $.each(this.children, function (index, child) {
            return child.click(callback);
        });
    };

    TreeNodeController.prototype.foreach = function (callback, allbut, path) {
        if (typeof path === "undefined") { path = []; }
        _super.prototype.foreach.call(this, callback, allbut);

        path.push(this);

        $.each(this.children, function (index, child) {
            return child.foreach(callback, allbut, path);
        });

        path.pop();
    };
    return TreeNodeController;
})(TreeController);

var TreeLeafController = (function (_super) {
    __extends(TreeLeafController, _super);
    function TreeLeafController(leafModel, leafView) {
        var _this = this;
        _super.call(this, leafModel, leafView);
        this.leafModel = leafModel;
        this.leafView = leafView;

        this.view.click = function () {
            return _this.leafModel.selected.val(!_this.leafModel.selected.val());
        };
        this.leafModel.selected.change(function () {
            return _this.modelSelected();
        });
    }
    TreeLeafController.prototype.modelSelected = function () {
        this.view.selected(this.leafModel.selected.val());
        this.selected(this);
    };
    return TreeLeafController;
})(TreeController);
//# sourceMappingURL=controllers.js.map

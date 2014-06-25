var Styles = (function () {
    function Styles() {
    }
    Styles.invisble = 'invisible';

    Styles.loading = 'ui-icon-power';

    Styles.busy = 'ui-icon-refresh';

    Styles.idle = 'ui-icon-check';

    Styles.expanded = 'ui-icon-circlesmall-minus';

    Styles.collapsed = 'ui-icon-circlesmall-plus';

    Styles.pageButton = 'pageButton';

    Styles.activePageButton = 'pageButtonSelected';

    Styles.disabledOption = 'disabledOption';

    Styles.notSorted = 'ui-icon-arrowthick-2-n-s';

    Styles.sortedUp = 'ui-icon-arrowthick-1-n';

    Styles.sortedDown = 'ui-icon-arrowthick-1-s';

    Styles.inputError = 'validationError';

    Styles.deleteConfirmation = 'deleteConfirm';

    Styles.treeNode = 'treeNode';

    Styles.nodeHeader = 'treeNodeHeader';

    Styles.isNode = 'nodeInTree';

    Styles.isLeaf = 'leafInTree';

    Styles.selectedNode = 'nodeSelected';

    Styles.accordionSettings = {
        active: false,
        animate: false,
        collapsible: true,
        heightStyle: 'content'
    };
    return Styles;
})();

var Tools = (function () {
    function Tools() {
    }
    Tools.setError = function (field, message) {
        if (message == null) {
            field.removeClass(Styles.inputError);
            field.removeAttr('title');

            return false;
        } else {
            field.addClass(Styles.inputError);
            field.attr('title', message);

            return true;
        }
    };

    Tools.fillMappingSelection = function (selector, items, nullSelection) {
        Tools.fillSelection(selector, items, nullSelection, function (item) {
            return item.id;
        }, function (item) {
            return item.name;
        });
    };

    Tools.fillSeriesSelection = function (selector, series, nullSelection) {
        Tools.fillSelection(selector, series, nullSelection, function (s) {
            return s.id;
        }, function (s) {
            return s.hierarchicalName;
        });
    };

    Tools.fillSelection = function (selector, items, nullSelection, getValue, getText) {
        selector.empty();

        $('<option />', { text: nullSelection, value: '' }).appendTo(selector);

        $.each(items, function (index, item) {
            return $('<option />', { text: getText(item), value: getValue(item) }).appendTo(selector);
        });
    };

    Tools.checkCollision = function (selector, name, identifier) {
        var existing = selector.find('option');

        for (var i = 1; i < existing.length; i++)
            if (existing[i].innerHTML == name)
                if (existing[i].getAttribute('value') != identifier)
                    return true;

        return false;
    };

    Tools.openDialog = function (dialog) {
        dialog.dialog({
            position: { of: '#main', at: 'center top+100', my: 'center top' },
            closeOnEscape: false,
            width: 'auto',
            modal: true
        });
    };
    return Tools;
})();

var GenreSelector = (function () {
    function GenreSelector(genre, container, onChange) {
        var id = 'genreCheckbox' + genre.id;

        this.checkbox = $('<input />', {
            'class': 'filterGenreToggle',
            type: 'checkbox',
            name: genre.id,
            id: id
        }).appendTo(container).change(onChange);

        this.label = $('<label />', { 'for': id, text: genre.name }).appendTo(container);
        this.description = genre.name;

        this.checkbox.button();
    }
    GenreSelector.prototype.reset = function () {
        if (this.checkbox.prop('checked')) {
            this.label.removeClass(Styles.invisble);
            this.checkbox.removeClass(Styles.invisble);
        } else {
            this.label.addClass(Styles.invisble);
            this.checkbox.addClass(Styles.invisble);
        }
    };

    GenreSelector.prototype.setCount = function (count) {
        this.checkbox.button('option', 'label', this.description + ' (' + count + ')');

        this.checkbox.removeClass(Styles.invisble);
        this.label.removeClass(Styles.invisble);
    };
    return GenreSelector;
})();

var GenreSelectors = (function () {
    function GenreSelectors(container, onChange) {
        this.container = container;
        this.onChange = onChange;
        this.genres = {};
    }
    GenreSelectors.prototype.initialize = function (genres) {
        var _this = this;
        this.container.empty();
        this.genres = {};

        $.each(genres, function (index, genre) {
            return _this.genres[genre.id] = new GenreSelector(genre, _this.container, _this.onChange);
        });
    };

    GenreSelectors.prototype.setCounts = function (statistics) {
        var _this = this;
        $.each(this.genres, function (key, genre) {
            return genre.reset();
        });
        $.each(statistics, function (index, genre) {
            return _this.genres[genre.id].setCount(genre.count);
        });
    };

    GenreSelectors.prototype.lookupGenreName = function (genre) {
        return this.genres[genre].description;
    };

    GenreSelectors.prototype.val = function (genres) {
        if (typeof genres === "undefined") { genres = undefined; }
        if (genres !== undefined) {
            var newValue = {};

            $.each(genres, function (index, genre) {
                return newValue[genre] = true;
            });

            this.container.find('input[type=checkbox]').each(function (index, checkbox) {
                return $(checkbox).prop('checked', newValue[checkbox.getAttribute('name')] || false).button('refresh');
            });
        }

        var selected = [];

        this.container.find('input[type=checkbox]:checked').each(function (index, checkbox) {
            return selected.push(checkbox.getAttribute('name'));
        });

        return selected;
    };
    return GenreSelectors;
})();

var LanguageSelector = (function () {
    function LanguageSelector(language, container) {
        var id = 'languageOption' + language.id;

        this.radio = $('<input />', { type: 'radio', id: id, name: LanguageSelector.optionGroupName, value: language.id }).appendTo(container);
        this.label = $('<label />', { 'for': id, text: language.name }).appendTo(container);
        this.description = language.name;
    }
    LanguageSelector.prototype.reset = function () {
        if (this.radio.prop('checked')) {
            this.label.removeClass(Styles.invisble);
            this.radio.removeClass(Styles.invisble);
        } else {
            this.label.addClass(Styles.invisble);
            this.radio.addClass(Styles.invisble);
        }
    };

    LanguageSelector.prototype.setCount = function (count) {
        this.radio.button('option', 'label', this.description + ' (' + count + ')');

        this.radio.removeClass(Styles.invisble);
        this.label.removeClass(Styles.invisble);
    };
    LanguageSelector.optionGroupName = 'languageChoice';
    return LanguageSelector;
})();

var LanguageSelectors = (function () {
    function LanguageSelectors(container, onChange) {
        this.container = container;
        this.languages = {};
        this.container.change(onChange);
    }
    LanguageSelectors.prototype.initialize = function (languages) {
        var _this = this;
        this.container.empty();
        this.languages = {};

        $('<input />', { type: 'radio', id: 'anyLanguageChoice', name: LanguageSelector.optionGroupName, value: '' }).appendTo(this.container);
        $('<label />', { 'for': 'anyLanguageChoice', text: '(egal)' }).appendTo(this.container);

        $.each(languages, function (index, language) {
            return _this.languages[language.id] = new LanguageSelector(language, _this.container);
        });

        this.container.find('input').button();
        this.val(null);
    };

    LanguageSelectors.prototype.setCounts = function (statistics) {
        var _this = this;
        $.each(this.languages, function (key, language) {
            return language.reset();
        });
        $.each(statistics, function (index, language) {
            return _this.languages[language.id].setCount(language.count);
        });
    };

    LanguageSelectors.prototype.lookupLanguageName = function (language) {
        if (language == null)
            return null;

        var selector = this.languages[language];
        if (selector == null)
            return null;
        else
            return selector.description;
    };

    LanguageSelectors.prototype.val = function (language) {
        if (typeof language === "undefined") { language = undefined; }
        if (language !== undefined) {
            this.container.find('input[value="' + (language || '') + '"]').prop('checked', true);
            this.container.find('input').button('refresh');
        }

        return this.container.find(':checked').val();
    };
    return LanguageSelectors;
})();

var SeriesSelectors = (function () {
    function SeriesSelectors(containerSelector) {
        this.container = $(containerSelector);
    }
    SeriesSelectors.prototype.resetFilter = function () {
        this.container.val(null);
    };

    SeriesSelectors.prototype.initialize = function (series) {
        Tools.fillSeriesSelection(this.container, series, '(egal)');
    };
    return SeriesSelectors;
})();

// Bietet die Hierarchie der Serien zur Auswahl im Filter an
var SeriesTreeSelector = (function () {
    function SeriesTreeSelector(containerSelector, onChanged) {
        var _this = this;
        this.nextReset = 0;
        this.container = $(containerSelector).keypress(function (ev) {
            return _this.onKeyPressed(ev);
        });
        this.whenChanged = onChanged;
    }
    // Ein Tastendruck führt im allgemeinen dazu, dass sich die Liste auf den ersten Eintrag mit einem passenden Namen verschiebt
    SeriesTreeSelector.prototype.onKeyPressed = function (ev) {
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
    };

    // Wenn das jQuery UI Accordion geöffnet wirde, müssen wir irgendwie einen sinnvollen Anfangszustand herstellen
    SeriesTreeSelector.prototype.activate = function () {
        this.container.focus();
        this.nextReset = 0;

        this.scrollToSelected();
    };

    // Ermittelt die aktuell ausgewählte Serie
    SeriesTreeSelector.prototype.selected = function () {
        return this.container.find('.' + Styles.selectedNode);
    };

    // Wählt eine bestimmt Serie aus
    SeriesTreeSelector.prototype.selectNode = function (node) {
        var wasSelected = node.hasClass(Styles.selectedNode);

        this.resetFilter();

        // Die Änderung wird an unseren Chef gemeldet
        if (wasSelected)
            this.whenChanged(null, null);
        else {
            node.addClass(Styles.selectedNode);

            this.whenChanged(node.attr(SeriesTreeSelector.attributeId), node.attr(SeriesTreeSelector.attributeName));
        }
    };

    // Stellt sicher, dass die aktuell ausgewählte Serie ganz oben angezeigt wird
    SeriesTreeSelector.prototype.scrollToSelected = function () {
        this.scrollTo(this.selected());
    };

    // Stellt sicher, dass eine beliebige Serie ganz oben dargestellt wird
    SeriesTreeSelector.prototype.scrollTo = function (selected) {
        if (selected.length < 1)
            return;

        for (var parent = selected.parent(); (parent.length == 1) && (parent[0] !== this.container[0]); parent = parent.parent()) {
            var toggle = parent.prev().children().first();
            if (toggle.hasClass(Styles.collapsed))
                toggle.removeClass(Styles.collapsed).addClass(Styles.expanded);

            parent.removeClass(Styles.invisble);
        }

        var firstTop = this.container.children().first().offset().top;
        var selectedTop = selected.offset().top;

        this.container.scrollTop(selectedTop - firstTop);
    };

    // Hebt die aktuelle Auswahl auf
    SeriesTreeSelector.prototype.resetFilter = function () {
        this.selected().removeClass(Styles.selectedNode);
    };

    // Baut die Hierarchie der Serien auf
    SeriesTreeSelector.prototype.initialize = function (series) {
        this.container.empty();

        this.buildTree(series.filter(function (s) {
            return s.parentId == null;
        }), this.container);
    };

    // Erzeugt einen Knoten oder ein Blatt für eine konkrete Serie
    SeriesTreeSelector.prototype.createNode = function (node, item, isLeaf) {
        var _this = this;
        // Zur Vereinfachung verwenden wir hier die fluent-API von jQuery
        return node.text(item.name).attr(SeriesTreeSelector.attributeId, item.id).attr(SeriesTreeSelector.attributeName, item.hierarchicalName).addClass(isLeaf ? Styles.isLeaf : Styles.isNode).on('click', function () {
            return _this.selectNode(node);
        });
    };

    // Baut ausgehend von einer Liste von Geschwisterserien den gesamten Baum unterhalb dieser Serien auf
    SeriesTreeSelector.prototype.buildTree = function (children, parent) {
        var _this = this;
        $.each(children, function (index, item) {
            // Für jede Serie wird ein gesondertes Fragment erzeugt
            var child = $('<div />').appendTo(parent);

            // Die Wurzelserien werden nicht markiert, da diese Markierung für das relative Einrücken sorgt
            if (item.parentId != null)
                child.addClass(Styles.treeNode);

            // Blätter sind sehr einfach darzustellen, bei Knoten müssen wir etwas mehr tun
            if (item.children.length < 1) {
                _this.createNode(child, item, true);
            } else {
                // Das kleine Symbol zum Auf- und Zuklappen muss auch noch rein
                var header = $('<div />', { 'class': Styles.nodeHeader }).appendTo(child);

                // Für die Unterserien wird ein eigener Container angelegt, den wir dann über dieses Symbol auf- und zuklappen
                var toggle = $('<div />', { 'class': 'ui-icon' }).addClass(Styles.collapsed).appendTo(header);

                // Nun kann der Name der Serie zum Anklicken eingeblendet werden
                _this.createNode($('<div />'), item, false).appendTo(header);

                // Dann erst die Unterserien
                var childContainer = $('<div />', { 'class': Styles.invisble }).appendTo(child);

                // Und wir müssen natürlich nicht auf die Änderung reagieren
                toggle.on('click', function (ev) {
                    if (ev.currentTarget !== ev.target)
                        return;

                    // Auf- oder Zuklappen, je nach aktuellem Zustand
                    if (toggle.hasClass(Styles.expanded)) {
                        toggle.removeClass(Styles.expanded);
                        toggle.addClass(Styles.collapsed);

                        childContainer.addClass(Styles.invisble);
                    } else {
                        toggle.removeClass(Styles.collapsed);
                        toggle.addClass(Styles.expanded);

                        childContainer.removeClass(Styles.invisble);
                    }
                });

                // Nun alle unsere Unterserien
                _this.buildTree(item.children, childContainer);
            }
        });
    };
    SeriesTreeSelector.attributeId = 'data-id';

    SeriesTreeSelector.attributeName = 'data-name';
    return SeriesTreeSelector;
})();

var MultiValueEditor = (function () {
    function MultiValueEditor(containerSelector, onChange) {
        this.onChange = onChange;

        this.container = $(containerSelector);
        this.container.buttonset();
    }
    MultiValueEditor.prototype.val = function (newVal) {
        if (newVal) {
            var map = {};
            $.each(newVal, function (index, id) {
                return map[id] = true;
            });

            $.each(this.container.find('input[type=checkbox]'), function (index, checkbox) {
                var selector = $(checkbox);

                selector.prop('checked', map[selector.val()] == true);
            });

            this.container.buttonset('refresh');

            return newVal;
        } else {
            var value = [];

            $.each(this.container.find('input[type=checkbox]:checked'), function (index, checkbox) {
                return value.push($(checkbox).val());
            });

            return value;
        }
    };

    MultiValueEditor.prototype.reset = function (items) {
        var _this = this;
        // Zuerst merken wir uns mal die aktuelle Einstellung
        var previousValue = this.val();

        // Dann wird die Oberfläche zurück gesetzt
        this.container.empty();

        // Und ganz neu aufgebaut
        $.each(items, function (index, item) {
            var id = "mve" + (++MultiValueEditor.idCounter);

            var checkbox = $('<input />', { type: 'checkbox', id: id, value: item.id }).appendTo(_this.container).click(function () {
                return _this.onChange();
            });
            var label = $('<label />', { 'for': id, text: item.name }).appendTo(_this.container);
        });

        // Alle Werte, die wir ausgewählt haben, werden wieder aktiviert - sofern sie bekannt sind
        this.val(previousValue);
    };
    MultiValueEditor.idCounter = 0;
    return MultiValueEditor;
})();

// Diese Basisklasse unterstützt die Pflege der festen Auswahllisten für Sprachen und Arten von Aufzeichnungen
var SuggestionListEditor = (function () {
    function SuggestionListEditor(openButtonSelector, reloadApplicationData) {
        var _this = this;
        this.identifier = null;
        this.reload = reloadApplicationData;

        this.confirmedDelete = new DeleteButton(this.dialog().find('.dialogDelete'), function () {
            return _this.remove();
        });

        $(openButtonSelector).click(function () {
            return _this.open();
        });

        this.saveButton().click(function () {
            return _this.save();
        });
        this.cancelButton().click(function () {
            return _this.close();
        });

        this.nameField().on('change', function () {
            return _this.validate();
        });
        this.nameField().on('input', function () {
            return _this.validate();
        });
        this.chooser().change(function () {
            return _this.choose();
        });
    }
    SuggestionListEditor.prototype.open = function () {
        // Vorher noch einmal schnell alles aufbereiten - eventuell erfolgt auch ein Aufruf an den Web Service
        this.chooser().val('');
        this.choose();

        Tools.openDialog(this.dialog());
    };

    SuggestionListEditor.prototype.close = function () {
        this.dialog().dialog('close');
    };

    SuggestionListEditor.prototype.restart = function () {
        this.close();

        // Wichtig ist, dass wir die neuen Listen in die Oberfläche laden
        this.reload();
    };

    SuggestionListEditor.prototype.createUpdate = function () {
        var newData = {
            name: (this.nameField().val() || '').trim(),
            id: null
        };

        // Der Downcast ist etwas unsauber, aber wir wissen hier genau, was wir tun
        return newData;
    };

    SuggestionListEditor.prototype.reset = function (list) {
        Tools.fillSelection(this.chooser(), list, this.createNewOption(), function (i) {
            return i.id;
        }, function (i) {
            return i.name;
        });
    };

    SuggestionListEditor.prototype.validate = function (newData) {
        if (typeof newData === "undefined") { newData = null; }
        if (newData == null)
            newData = this.createUpdate();

        var isValid = true;

        var nameError = this.validateName(newData);
        if (nameError == null)
            if (Tools.checkCollision(this.chooser(), newData.name, this.identifier))
                nameError = "Der Name wird bereits verwendet";

        if (Tools.setError(this.nameField(), nameError))
            isValid = false;

        this.saveButton().button('option', 'disabled', !isValid);

        return isValid;
    };

    SuggestionListEditor.prototype.choose = function () {
        var _this = this;
        // Die aktuelle Auswahl ermitteln
        var choosen = this.chooser().val();

        // Und dann ganz defensiv erst einmal alles zurück setzen
        this.saveButton().button('option', 'disabled', choosen.length > 0);

        this.confirmedDelete.disable();

        this.nameField().val('');

        if (choosen.length < 1) {
            // Einfach ist es, wenn wir etwas neu Anlegen
            this.identifier = '';

            this.validate();
        } else {
            // Ansonsten fragen wir den Web Service immer nach dem neuesten Stand
            this.identifier = null;

            $.ajax('movie/' + this.controllerName() + '/' + choosen).done(function (info) {
                if (info == null)
                    return;

                _this.identifier = info.id;

                _this.nameField().val(info.name);

                if (info.unused)
                    _this.confirmedDelete.enable();

                // Für den unwahrscheinlichen Fall, dass sich die Spielregeln verändert haben - und um die Schaltfläche zum Speichern zu aktivieren
                _this.validate();
            });
        }
    };

    SuggestionListEditor.prototype.remove = function () {
        var _this = this;
        if (this.identifier == null)
            return;
        if (this.identifier.length < 1)
            return;

        $.ajax('movie/' + this.controllerName() + '/' + this.identifier, {
            type: 'DELETE'
        }).done(function () {
            return _this.restart();
        }).fail(function () {
            // Bei der Fehlerbehandlung ist noch Potential
            alert('Da ist leider etwas schief gegangen');
        });
    };

    SuggestionListEditor.prototype.save = function () {
        var _this = this;
        if (this.identifier == null)
            return;

        var newData = this.createUpdate();

        // Vorsichtshalbe schauen wir noch einmal nach, ob das alles so in Ordnung geht
        if (!this.validate(newData))
            return;

        var url = 'movie/' + this.controllerName();
        if (this.identifier.length > 0)
            url += '/' + this.identifier;

        $.ajax(url, {
            type: (this.identifier.length < 1) ? 'POST' : 'PUT',
            contentType: 'application/json; charset=utf-8',
            data: JSON.stringify(newData)
        }).done(function () {
            return _this.restart();
        }).fail(function () {
            // Bei der Fehlerbehandlung ist noch Potential
            alert('Da ist leider etwas schief gegangen');
        });
    };

    // Alles was jetzt kommt sind eigentlich die abstrakten Methoden der Basisklasse
    SuggestionListEditor.prototype.controllerName = function () {
        throw 'Bitte controllerName implementieren';
    };

    SuggestionListEditor.prototype.createNewOption = function () {
        throw 'Bitte createNewOption implementieren';
    };

    SuggestionListEditor.prototype.dialog = function () {
        throw 'Bitte dialog implementieren';
    };

    SuggestionListEditor.prototype.chooser = function () {
        return this.dialog().find('.selectKey');
    };

    SuggestionListEditor.prototype.saveButton = function () {
        return this.dialog().find('.dialogSave');
    };

    SuggestionListEditor.prototype.cancelButton = function () {
        return this.dialog().find('.dialogCancel');
    };

    SuggestionListEditor.prototype.nameField = function () {
        return this.dialog().find('.editName');
    };

    SuggestionListEditor.prototype.validateName = function (newData) {
        throw 'Bitte validateName implementieren';
    };
    return SuggestionListEditor;
})();

var DeleteButton = (function () {
    function DeleteButton(button, process) {
        var _this = this;
        this.button = button.click(function () {
            return _this.remove();
        });
        this.process = process;
    }
    DeleteButton.prototype.disable = function () {
        this.button.removeClass(Styles.deleteConfirmation);
        this.button.button('option', 'disabled', true);
    };

    DeleteButton.prototype.enable = function () {
        this.button.button('option', 'disabled', false);
    };

    DeleteButton.prototype.remove = function () {
        if (this.button.hasClass(Styles.deleteConfirmation))
            this.process();
        else
            this.button.addClass(Styles.deleteConfirmation);
    };
    return DeleteButton;
})();
//# sourceMappingURL=uiHelper.js.map

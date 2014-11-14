var Styles = (function () {
    function Styles() {
    }
    Styles.invisble = 'invisible';
    Styles.loading = 'ui-icon-power';
    Styles.busy = 'ui-icon-refresh';
    Styles.idle = 'ui-icon-check';
    Styles.expanded = 'ui-icon-triangle-1-s';
    Styles.collapsed = 'ui-icon-triangle-1-e';
    Styles.pageButton = 'pageButton';
    Styles.activePageButton = 'pageButtonSelected';
    Styles.notSorted = 'ui-icon-arrowthick-2-n-s';
    Styles.sortedUp = 'ui-icon-arrowthick-1-n';
    Styles.sortedDown = 'ui-icon-arrowthick-1-s';
    Styles.inputError = 'validationError';
    Styles.deleteConfirmation = 'deleteConfirm';
    Styles.treeNode = 'treeNode';
    Styles.treeItem = 'treeItem';
    Styles.nodeHeader = 'treeNodeHeader';
    Styles.selectedNode = 'nodeSelected';
    Styles.accordionSettings = {
        active: false,
        animate: false,
        collapsible: true,
        heightStyle: 'content',
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
        }
        else {
            field.addClass(Styles.inputError);
            field.attr('title', message);
            return true;
        }
    };
    Tools.fillMappingSelection = function (selector, items, nullSelection) {
        Tools.fillSelection(selector, items, nullSelection, function (item) { return item.id; }, function (item) { return item.name; });
    };
    Tools.fillSeriesSelection = function (selector, series, nullSelection) {
        Tools.fillSelection(selector, series, nullSelection, function (s) { return s.id; }, function (s) { return s.hierarchicalName; });
    };
    Tools.fillSelection = function (selector, items, nullSelection, getValue, getText) {
        selector.empty();
        $('<option />', { text: nullSelection, value: '' }).appendTo(selector);
        $.each(items, function (index, item) { return $('<option />', { text: getText(item), value: getValue(item) }).appendTo(selector); });
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
            closeOnEscape: true,
            width: 'auto',
            modal: true,
        });
    };
    // Erstellt das Standardeinzeigeformat für ein Datum mit Uhrzeit.
    Tools.toFullDateWithTime = function (dateTime) {
        // Eine zweistellig Zahl erzeugen
        var formatNumber = function (val) { return (val < 10) ? ('0' + val.toString()) : val.toString(); };
        return formatNumber(dateTime.getDate()) + '.' + formatNumber(1 + dateTime.getMonth()) + '.' + dateTime.getFullYear().toString() + ' ' + formatNumber(dateTime.getHours()) + ':' + formatNumber(dateTime.getMinutes()) + ':' + formatNumber(dateTime.getSeconds());
    };
    return Tools;
})();
var MultiValueEditor = (function () {
    function MultiValueEditor(containerSelector, onChange) {
        this.onChange = onChange;
        this.container = $(containerSelector);
    }
    MultiValueEditor.prototype.val = function (newVal) {
        if (newVal) {
            var map = {};
            $.each(newVal, function (index, id) { return map[id] = true; });
            $.each(this.container.find('input[type=checkbox]'), function (index, checkbox) {
                var selector = $(checkbox);
                selector.prop('checked', map[selector.val()] == true).button('refresh');
            });
            return newVal;
        }
        else {
            var value = [];
            $.each(this.container.find('input[type=checkbox]:checked'), function (index, checkbox) { return value.push($(checkbox).val()); });
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
            var checkbox = $('<input />', { type: 'checkbox', id: id, value: item.id }).appendTo(_this.container).click(function () { return _this.onChange(); });
            var label = $('<label />', { 'for': id, text: item.name }).appendTo(_this.container);
            checkbox.button();
        });
        // Alle Werte, die wir ausgewählt haben, werden wieder aktiviert - sofern sie bekannt sind
        this.val(previousValue);
    };
    MultiValueEditor.idCounter = 0;
    return MultiValueEditor;
})();
// Diese Basisklasse unterstützt die Pflege der festen Auswahllisten für Sprachen und Kategorien
var SuggestionListEditor = (function () {
    function SuggestionListEditor(openButtonSelector, reloadApplicationData) {
        var _this = this;
        this.identifier = null;
        this.reload = reloadApplicationData;
        this.confirmedDelete = new DeleteButton(this.dialog().find('.dialogDelete'), function () { return _this.remove(); });
        $(openButtonSelector).click(function () { return _this.open(); });
        this.saveButton().click(function () { return _this.save(); });
        this.cancelButton().click(function () { return _this.close(); });
        this.nameField().on('change', function () { return _this.validate(); });
        this.nameField().on('input', function () { return _this.validate(); });
        this.chooser().change(function () { return _this.choose(); });
    }
    SuggestionListEditor.prototype.open = function () {
        // Vorher noch einmal schnell alles aufbereiten
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
            id: null,
        };
        // Der Downcast ist etwas unsauber, aber wir wissen hier genau, was wir tun
        return newData;
    };
    SuggestionListEditor.prototype.reset = function (list) {
        Tools.fillSelection(this.chooser(), list, this.createNewOption(), function (i) { return i.id; }, function (i) { return i.name; });
    };
    SuggestionListEditor.prototype.validate = function (newData) {
        if (newData === void 0) { newData = null; }
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
        this.saveButton().button('option', 'disabled', true);
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
            $.ajax('movie/' + this.controllerName() + '/' + choosen).done(function (info) {
                if (info == null)
                    return;
                _this.identifier = info.id;
                _this.nameField().val(info.name);
                // Einträge der Voschlaglisten dürfen nur gelöscht werden, wenn sie nicht in Verwendung sind
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
        $.ajax('movie/' + this.controllerName() + '/' + this.identifier, { type: 'DELETE' }).done(function () { return _this.restart(); }).fail(function () { return alert('Da ist leider etwas schief gegangen'); });
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
            type: (this.identifier.length > 0) ? 'PUT' : 'POST',
            contentType: 'application/json; charset=utf-8',
            data: JSON.stringify(newData),
        }).done(function () { return _this.restart(); }).fail(function () { return alert('Da ist leider etwas schief gegangen'); });
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
    SuggestionListEditor.prototype.validateName = function (newData) {
        throw 'Bitte validateName implementieren';
    };
    return SuggestionListEditor;
})();
// Beim Löschen verzichten wir auf eine explizite Rückfrage sondern erzwingen einfach das
// doppelte Betätigung der Schaltfläche nach einem visuellen Feedback mit dem ersten Drücken.
var DeleteButton = (function () {
    function DeleteButton(button, process) {
        var _this = this;
        this.button = button.click(function () { return _this.remove(); });
        this.process = process;
    }
    DeleteButton.prototype.disable = function () {
        this.button.removeClass(Styles.deleteConfirmation);
        this.button.removeAttr('title');
        this.button.button('option', 'disabled', true);
    };
    DeleteButton.prototype.enable = function () {
        this.button.button('option', 'disabled', false);
    };
    DeleteButton.prototype.remove = function () {
        if (this.button.hasClass(Styles.deleteConfirmation))
            this.process();
        else {
            this.button.addClass(Styles.deleteConfirmation);
            this.button.attr('title', 'Noch einmal Drücken zum unwiederruflichen Löschen');
        }
    };
    return DeleteButton;
})();
//# sourceMappingURL=uihelper.js.map
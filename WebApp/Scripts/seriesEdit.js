/// <reference path='typings/jquery/jquery.d.ts' />
/// <reference path='typings/jqueryui/jqueryui.d.ts' />
/// <reference path='interfaces.ts' />
var SeriesEditor = (function () {
    function SeriesEditor(openButtonSelector, reloadApplicationData) {
        var _this = this;
        this.seriesIdentifier = null;
        this.reload = reloadApplicationData;

        $(openButtonSelector).click(function () {
            return _this.open();
        });

        this.saveButton().click(function () {
            return _this.save();
        });
        this.cancelButton().click(function () {
            return _this.close();
        });
        this.deleteButton().click(function () {
            return _this.remove();
        });

        this.descriptionField().on('change', function () {
            return _this.validate();
        });
        this.descriptionField().on('input', function () {
            return _this.validate();
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
    SeriesEditor.prototype.open = function () {
        // Vorher noch einmal schnell alles aufbereiten - eventuell erfolgt auch ein Aufruf an den Web Service
        this.choose();

        this.dialog().dialog({
            position: { of: '#dialogAnchor', at: 'center top+20', my: 'center top' },
            closeOnEscape: false,
            width: 'auto',
            modal: true
        });
    };

    SeriesEditor.prototype.close = function () {
        this.dialog().dialog('close');
    };

    SeriesEditor.prototype.restart = function () {
        this.close();

        // Wichtig ist, dass wir die neuen Listen in die Oberfläche laden
        this.reload();
    };

    SeriesEditor.prototype.createUpdate = function () {
        var newData = {
            name: this.nameField().val().trim(),
            parentId: this.parentChooser().val(),
            description: this.descriptionField().val().trim()
        };

        return newData;
    };

    SeriesEditor.prototype.reset = function (list) {
        Tools.fillSeriesSelection(this.chooser(), list, '(Neue Serie anlegen)');
        Tools.fillSeriesSelection(this.parentChooser(), list, '(Keine)');
    };

    SeriesEditor.prototype.validate = function (newData) {
        if (typeof newData === "undefined") { newData = null; }
        if (newData == null)
            newData = this.createUpdate();

        var isValid = true;

        if (Tools.setError(this.nameField(), this.validateName(newData)))
            isValid = false;
        if (Tools.setError(this.descriptionField(), this.validateDescription(newData)))
            isValid = false;

        this.saveButton().button('option', 'disabled', !isValid);

        return isValid;
    };

    SeriesEditor.prototype.choose = function () {
        var _this = this;
        // Die aktuelle Auswahl ermitteln
        var choosen = this.chooser().val();

        // Und dann ganz defensiv erst einmal alles zurück setzen
        this.saveButton().button('option', 'disabled', choosen.length > 0);
        this.deleteButton().button('option', 'disabled', true);

        this.parentChooser().val('');
        this.nameField().val('');
        this.descriptionField().val('');

        if (choosen.length < 1) {
            // Einfach ist es, wenn wir etwas neu Anlegen
            this.seriesIdentifier = '';

            this.validate();
        } else {
            // Ansonsten fragen wir den Web Service immer nach dem neuesten Stand
            this.seriesIdentifier = null;

            $.ajax('movie/series/' + choosen).done(function (info) {
                if (info == null)
                    return;

                _this.seriesIdentifier = info.id;

                _this.nameField().val(info.name);
                _this.descriptionField().val(info.description);
                _this.parentChooser().val(info.parentId);

                _this.deleteButton().button('option', 'disabled', !info.unused);

                // Für den unwahrscheinlichen Fall, dass sich die Spielregeln verändert haben - und um die Schaltfläche zum Speichern zu aktivieren
                _this.validate();
            });
        }
    };

    SeriesEditor.prototype.remove = function () {
        var _this = this;
        if (this.seriesIdentifier == null)
            return;
        if (this.seriesIdentifier.length < 1)
            return;

        var newData = this.createUpdate();

        $.ajax('movie/series/' + this.seriesIdentifier, {
            type: 'DELETE'
        }).done(function () {
            return _this.restart();
        }).fail(function () {
            // Bei der Fehlerbehandlung ist noch Potential
            alert('Da ist leider etwas schief gegangen');
        });
    };

    SeriesEditor.prototype.save = function () {
        var _this = this;
        if (this.seriesIdentifier == null)
            return;

        var newData = this.createUpdate();

        // Vorsichtshalbe schauen wir noch einmal nach, ob das alles so in Ordnung geht
        if (!this.validate(newData))
            return;

        var url = 'movie/series';
        var parent = this.seriesIdentifier;
        if (parent.length > 0)
            url += '/' + parent;

        $.ajax(url, {
            type: (parent.length < 1) ? 'POST' : 'PUT',
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
    SeriesEditor.prototype.dialog = function () {
        return $('#seriesEditDialog');
    };

    SeriesEditor.prototype.chooser = function () {
        return this.dialog().find('.selectKey');
    };

    SeriesEditor.prototype.parentChooser = function () {
        return this.dialog().find('.editParent');
    };

    SeriesEditor.prototype.saveButton = function () {
        return this.dialog().find('.dialogSave');
    };

    SeriesEditor.prototype.deleteButton = function () {
        return this.dialog().find('.dialogDelete');
    };

    SeriesEditor.prototype.cancelButton = function () {
        return this.dialog().find('.dialogCancel');
    };

    SeriesEditor.prototype.nameField = function () {
        return this.dialog().find('.editKey');
    };

    SeriesEditor.prototype.descriptionField = function () {
        return this.dialog().find('.editName');
    };

    SeriesEditor.prototype.validateName = function (newData) {
        var name = newData.name;

        if (name.length < 1)
            return 'Es muss ein Name angegeben werden';
        else if (name.length > 50)
            return 'Der Name darf maximal 50 Zeichen haben';
        else
            return null;
    };

    SeriesEditor.prototype.validateDescription = function (newData) {
        var description = newData.description;

        if (description.length > 2000)
            return 'Die Beschreibung darf maximal 2000 Zeichen haben';
        else
            return null;
    };
    return SeriesEditor;
})();
//# sourceMappingURL=seriesEdit.js.map

﻿/// <reference path='typings/jquery/jquery.d.ts' />
/// <reference path='typings/jqueryui/jqueryui.d.ts' />
/// <reference path='interfaces.ts' />
var ContainerEditor = (function () {
    function ContainerEditor(openButtonSelector, reloadApplicationData) {
        var _this = this;
        this.containerName = null;
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
        this.parentChooser().change(function () {
            return _this.validate();
        });
        this.chooser().change(function () {
            return _this.choose();
        });
    }
    ContainerEditor.prototype.open = function () {
        // Vorher noch einmal schnell alles aufbereiten - eventuell erfolgt auch ein Aufruf an den Web Service
        this.choose();

        Tools.openDialog(this.dialog());
    };

    ContainerEditor.prototype.close = function () {
        this.dialog().dialog('close');
    };

    ContainerEditor.prototype.restart = function () {
        this.close();

        // Wichtig ist, dass wir die neuen Listen in die Oberfläche laden
        this.reload();
    };

    ContainerEditor.prototype.createUpdate = function () {
        var newData = {
            parentId: this.parentChooser().val(),
            name: (this.nameField().val() || '').trim(),
            description: (this.descriptionField().val() || '').trim()
        };

        return newData;
    };

    ContainerEditor.prototype.reset = function (list) {
        Tools.fillStringSelection(this.chooser(), list, '(Neue Aufbewahrung anlegen)');
        Tools.fillStringSelection(this.parentChooser(), list, '(Keine)');
    };

    ContainerEditor.prototype.validate = function (newData) {
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

    ContainerEditor.prototype.choose = function () {
        var _this = this;
        // Die aktuelle Auswahl ermitteln
        var choosen = this.chooser().val();

        // Und dann ganz defensiv erst einmal alles zurück setzen
        this.saveButton().button('option', 'disabled', choosen.length > 0);
        this.deleteButton().button('option', 'disabled', true);

        this.parentChooser().val('');
        this.nameField().val('');
        this.descriptionField().val('');
        this.locationField().val('');
        this.typeField().val('0');

        if (choosen.length < 1) {
            // Einfach ist es, wenn wir etwas neu Anlegen
            this.containerName = '';

            this.validate();
        } else {
            // Ansonsten fragen wir den Web Service immer nach dem neuesten Stand
            this.containerName = null;

            $.ajax('movie/container/?name=' + encodeURIComponent(choosen)).done(function (info) {
                if (info == null)
                    return;

                _this.containerName = info.name;

                _this.nameField().val(info.name);
                _this.descriptionField().val(info.description);
                _this.parentChooser().val(info.parent);
                _this.typeField().val(info.type.toString());
                _this.locationField().val(info.location);

                _this.deleteButton().button('option', 'disabled', false);

                // Für den unwahrscheinlichen Fall, dass sich die Spielregeln verändert haben - und um die Schaltfläche zum Speichern zu aktivieren
                _this.validate();
            });
        }
    };

    ContainerEditor.prototype.remove = function () {
        var _this = this;
        if (this.containerName == null)
            return;
        if (this.containerName.length < 1)
            return;

        var newData = this.createUpdate();

        $.ajax('movie/container/' + encodeURIComponent(this.containerName), {
            type: 'DELETE'
        }).done(function () {
            return _this.restart();
        }).fail(function () {
            // Bei der Fehlerbehandlung ist noch Potential
            alert('Da ist leider etwas schief gegangen');
        });
    };

    ContainerEditor.prototype.save = function () {
        var _this = this;
        if (this.containerName == null)
            return;

        var newData = this.createUpdate();

        // Vorsichtshalbe schauen wir noch einmal nach, ob das alles so in Ordnung geht
        if (!this.validate(newData))
            return;

        var url = 'movie/container';
        var container = this.containerName;
        if (container.length > 0)
            url += '/?name=' + encodeURIComponent(container);

        $.ajax(url, {
            type: (container.length < 1) ? 'POST' : 'PUT',
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
    ContainerEditor.prototype.dialog = function () {
        return $('#containerEditDialog');
    };

    ContainerEditor.prototype.chooser = function () {
        return this.dialog().find('.selectName');
    };

    ContainerEditor.prototype.parentChooser = function () {
        return this.dialog().find('.editParent');
    };

    ContainerEditor.prototype.saveButton = function () {
        return this.dialog().find('.dialogSave');
    };

    ContainerEditor.prototype.deleteButton = function () {
        return this.dialog().find('.dialogDelete');
    };

    ContainerEditor.prototype.cancelButton = function () {
        return this.dialog().find('.dialogCancel');
    };

    ContainerEditor.prototype.nameField = function () {
        return this.dialog().find('.editName');
    };

    ContainerEditor.prototype.descriptionField = function () {
        return this.dialog().find('.editDescription');
    };

    ContainerEditor.prototype.typeField = function () {
        return this.dialog().find('.chooseType');
    };

    ContainerEditor.prototype.locationField = function () {
        return this.dialog().find('.editLocation');
    };

    ContainerEditor.prototype.validateName = function (newData) {
        var name = newData.name;

        if (name.length < 1)
            return 'Es muss ein Name angegeben werden';
        else if (name.length > 50)
            return 'Der Name darf maximal 50 Zeichen haben';
        else
            return null;
    };

    ContainerEditor.prototype.validateDescription = function (newData) {
        var description = newData.description;

        if (description.length > 2000)
            return 'Der Standort darf maximal 2000 Zeichen haben';
        else
            return null;
    };
    return ContainerEditor;
})();
//# sourceMappingURL=containerEdit.js.map
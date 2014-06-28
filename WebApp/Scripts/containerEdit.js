var ContainerEditor = (function () {
    function ContainerEditor(openButtonSelector, reloadApplicationData) {
        var _this = this;
        this.identifier = null;
        this.reload = reloadApplicationData;

        this.childTable().accordion(Styles.accordionSettings);
        this.recordingTable().accordion(Styles.accordionSettings);

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
        this.chooser().val('');
        this.choose();

        Tools.openDialog(this.dialog());

        // Wir positionieren uns etwas weiter oben als die anderen Dialog, da wir eine dynamische Größe haben können
        this.dialog().dialog('option', 'position', { of: '#main', at: 'center top', my: 'center top' });
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
            description: (this.descriptionField().val() || '').trim(),
            location: (this.locationField().val() || '').trim(),
            name: (this.nameField().val() || '').trim(),
            parent: this.parentChooser().val(),
            type: this.typeField().val()
        };

        return newData;
    };

    ContainerEditor.prototype.reset = function (list) {
        Tools.fillMappingSelection(this.chooser(), list, '(Neue Aufbewahrung anlegen)');
        Tools.fillMappingSelection(this.parentChooser(), list, '(Keine)');
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
        if (Tools.setError(this.locationField(), this.validateLocation(newData)))
            isValid = false;

        this.saveButton().button('option', 'disabled', !isValid);

        return isValid;
    };

    ContainerEditor.prototype.fillChildTable = function (containers) {
        var table = this.childTable();
        var count = containers.length;

        if (count > 0) {
            if (count == 1)
                table.find('.ui-accordion-header>span').text('Eine Aufbewahrung');
            else
                table.find('.ui-accordion-header>span').text(count + ' Aufbewahrungen');

            var content = table.find('tbody');

            content.empty();

            $.each(containers, function (index, container) {
                return $('<td />').text(container).appendTo($('<tr />').appendTo(content));
            });

            table.removeClass(Styles.invisble);

            table.accordion('option', 'active', false);
        } else
            table.addClass(Styles.invisble);
    };

    ContainerEditor.prototype.fillRecordingTable = function (recordings) {
        var table = this.recordingTable();
        var count = recordings.length;
        if (count > 0) {
            if (count == 1)
                table.find('.ui-accordion-header>span').text('Eine Aufzeichnung');
            else
                table.find('.ui-accordion-header>span').text(count + ' Aufzeichnungen');

            var content = table.find('tbody');

            content.empty();

            $.each(recordings, function (index, recording) {
                var row = $('<tr />').appendTo(content);

                $('<td />').text(recording.name).appendTo(row);
                $('<td />').text(recording.position).appendTo(row);
            });

            table.removeClass(Styles.invisble);

            table.accordion('option', 'active', false);
        } else
            table.addClass(Styles.invisble);
    };

    ContainerEditor.prototype.choose = function () {
        var _this = this;
        // Die aktuelle Auswahl ermitteln
        var choosen = this.chooser().val();

        // Und dann ganz defensiv erst einmal alles zurück setzen
        this.saveButton().button('option', 'disabled', choosen.length > 0);
        this.confirmedDelete.disable();

        this.dialog().find('.collapsableCount').text(null);

        this.descriptionField().val('');
        this.parentChooser().val('');
        this.locationField().val('');
        this.nameField().val('');
        this.typeField().val('0');

        if (choosen.length < 1) {
            this.childTable().addClass(Styles.invisble);
            this.recordingTable().addClass(Styles.invisble);

            // Einfach ist es, wenn wir etwas neu Anlegen
            this.identifier = '';

            this.validate();
        } else {
            // Ansonsten fragen wir den Web Service immer nach dem neuesten Stand
            this.identifier = null;

            $.ajax('movie/container/' + choosen).done(function (info) {
                if (info == null)
                    return;

                _this.identifier = info.id;

                _this.descriptionField().val(info.description);
                _this.typeField().val(info.type.toString());
                _this.locationField().val(info.location);
                _this.parentChooser().val(info.parent);
                _this.nameField().val(info.name);

                _this.fillChildTable(info.children);
                _this.fillRecordingTable(info.recordings);
                _this.confirmedDelete.enable();

                // Für den unwahrscheinlichen Fall, dass sich die Spielregeln verändert haben - und um die Schaltfläche zum Speichern zu aktivieren
                _this.validate();
            });
        }
    };

    ContainerEditor.prototype.remove = function () {
        var _this = this;
        if (this.identifier == null)
            return;
        if (this.identifier.length < 1)
            return;

        $.ajax('movie/container/' + this.identifier, {
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
        if (this.identifier == null)
            return;

        var newData = this.createUpdate();

        // Vorsichtshalbe schauen wir noch einmal nach, ob das alles so in Ordnung geht
        if (!this.validate(newData))
            return;

        var url = 'movie/container';
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

    ContainerEditor.prototype.childTable = function () {
        return this.dialog().find('.containerChildren');
    };

    ContainerEditor.prototype.recordingTable = function () {
        return this.dialog().find('.containerRecordings');
    };

    ContainerEditor.prototype.validateName = function (newData) {
        var name = newData.name;

        if (name.length < 1)
            return 'Es muss ein Name angegeben werden';
        else if (name.length > 50)
            return 'Der Name darf maximal 50 Zeichen haben';
        else if (Tools.checkCollision(this.chooser(), newData.name, this.identifier))
            return 'Der Name wird bereits verwendet';
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

    ContainerEditor.prototype.validateLocation = function (newData) {
        var location = newData.location;

        if (location.length > 100)
            return 'Der Position in der übergeordnete Aufzeichnung darf maximal 100 Zeichen haben';
        else
            return null;
    };
    return ContainerEditor;
})();
//# sourceMappingURL=containerEdit.js.map

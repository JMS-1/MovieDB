var LinkEditor = (function () {
    function LinkEditor(openButtonSelector, recordingAccessor) {
        var _this = this;
        this.links = [];
        this.recording = recordingAccessor;

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
        this.urlField().on('change', function () {
            return _this.validate();
        });
        this.urlField().on('input', function () {
            return _this.validate();
        });
        this.chooser().change(function () {
            return _this.choose();
        });
    }
    LinkEditor.prototype.open = function () {
        // Beim Öffnen lesen wir die aktuelle Liste der Verweise aus
        this.links = this.recording().links();

        Tools.fillSelection(this.chooser(), this.links, '(Neuen Verweis anlegen)', function (i) {
            return i.name;
        }, function (i) {
            return i.name;
        });

        Tools.openDialog(this.dialog());

        // Und alles beginne ganz von vorne
        this.choose();
    };

    LinkEditor.prototype.viewToModel = function () {
        var contract = {
            description: (this.descriptionField().val() || '').trim(),
            name: (this.nameField().val() || '').trim(),
            url: (this.urlField().val() || '').trim()
        };

        return contract;
    };

    LinkEditor.prototype.close = function () {
        this.dialog().dialog('close');
    };

    LinkEditor.prototype.choose = function () {
        var selected = this.chooser().val();
        var link = null;

        // Ist ein Verweis ausgewählt, so suchen wir den in der vorhandenen Liste, die wir beim Öffnen des Dialogs ermittelt haben
        if (selected != '')
            for (var i = 0; i < this.links.length; i++)
                if (this.links[i].name == selected) {
                    link = this.links[i];

                    break;
                }

        // Haben wir einen Verweis, so gehen wir in den Änderungsmodus - ansonsten legen wir einen neuen Verweis an
        if (link == null) {
            this.confirmedDelete.disable();
            this.descriptionField().val('');
            this.nameField().val('');
            this.urlField().val('');
        } else {
            this.confirmedDelete.enable();
            this.descriptionField().val(link.description);
            this.nameField().val(link.name);
            this.urlField().val(link.url);
        }

        // Auch die initialen Werte sollen geprüft werden
        this.validate();
    };

    LinkEditor.prototype.validate = function (newData) {
        if (typeof newData === "undefined") { newData = null; }
        if (newData == null)
            newData = this.viewToModel();

        var isValid = true;

        if (Tools.setError(this.nameField(), this.validateName(newData)))
            isValid = false;
        if (Tools.setError(this.urlField(), this.validateLink(newData)))
            isValid = false;
        if (Tools.setError(this.descriptionField(), this.validateDescription(newData)))
            isValid = false;

        this.saveButton().button('option', 'disabled', !isValid);

        return isValid;
    };

    LinkEditor.prototype.remove = function () {
        // Wir können nur existierende Verweise entfernen
        var selected = this.chooser().val();
        if (selected == '')
            return;

        for (var i = 0; i < this.links.length; i++)
            if (this.links[i].name == selected) {
                this.links.splice(i, 1);

                break;
            }

        this.recording().links(this.links);
        this.close();
    };

    LinkEditor.prototype.save = function () {
        var newData = this.viewToModel();

        // Wir speichern nur gültige Verweise
        if (!this.validate(newData))
            return;

        var selected = this.chooser().val();

        // Beim Neuanlegen wir die Liste der Verweise erweitert, sonst einfach nur der ausgewählte Verweis durch die neuen Daten ersetzt
        if (selected == '')
            this.links.push(newData);
        else
            for (var i = 0; i < this.links.length; i++)
                if (this.links[i].name == selected) {
                    this.links[i] = newData;

                    break;
                }

        this.recording().links(this.links);
        this.close();
    };

    LinkEditor.prototype.dialog = function () {
        return $('#linkEditDialog');
    };

    LinkEditor.prototype.chooser = function () {
        return this.dialog().find('.selectName');
    };

    LinkEditor.prototype.saveButton = function () {
        return this.dialog().find('.dialogSave');
    };

    LinkEditor.prototype.cancelButton = function () {
        return this.dialog().find('.dialogCancel');
    };

    LinkEditor.prototype.nameField = function () {
        return this.dialog().find('.editName');
    };

    LinkEditor.prototype.urlField = function () {
        return this.dialog().find('.editLink');
    };

    LinkEditor.prototype.descriptionField = function () {
        return this.dialog().find('.editDescription');
    };

    LinkEditor.prototype.validateName = function (newData) {
        var name = newData.name;

        if (name.length < 1)
            return 'Es muss ein Name angegeben werden';
        else if (name.length > 100)
            return 'Der Name darf maximal 100 Zeichen haben';

        var chooser = this.chooser();
        var selected = chooser.val();
        if (selected == name)
            return null;

        if (this.links.some(function (l) {
            return l.name == name;
        }))
            return 'Der Name muss eindeutig sein';
        else
            return null;
    };

    LinkEditor.prototype.validateLink = function (newData) {
        var link = newData.url;

        if (link.length < 1)
            return 'Es muss ein Verweis angegeben werden';
        else if (link.length > 2000)
            return 'Der Verweis darf maximal 2000 Zeichen haben';
        else if (!LinkEditor.urlPattern.test(link))
            return 'Der Verweis ist ungültig';
        else
            return null;
    };

    LinkEditor.prototype.validateDescription = function (newData) {
        var description = newData.description;

        if (description.length > 2000)
            return 'Die Beschreibung darf maximal 2000 Zeichen haben';
        else
            return null;
    };
    LinkEditor.urlPattern = new RegExp(".{2001}");
    return LinkEditor;
})();
//# sourceMappingURL=linkEdit.js.map

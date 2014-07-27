var LinkEditor = (function () {
    function LinkEditor(openButtonSelector, recordingAccessor) {
        var _this = this;
        this.identifier = null;
        this.linkMap = {};
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
    }
    LinkEditor.prototype.open = function () {
        var _this = this;
        var recording = this.recording();
        var links = recording.viewToModel().links;

        this.linkMap = {};

        $.each(links, function (index, link) {
            return _this.linkMap[link.name] = link;
        });

        Tools.fillSelection(this.chooser(), links, '(Neuen Verweis anlegen)', function (i) {
            return i.name;
        }, function (i) {
            return i.name;
        });

        Tools.openDialog(this.dialog());

        this.validate();
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
    };

    LinkEditor.prototype.save = function () {
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
    LinkEditor.urlPattern = /http[s]?:\/\/(\w+:{0,1}\w*@)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-\/]))?/;
    return LinkEditor;
})();
//# sourceMappingURL=linkEdit.js.map

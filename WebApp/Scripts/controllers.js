// Die Auswahl des Verleihers wird über drei separate Optionsfelder realisiert
var RentFilterController = (function () {
    function RentFilterController(view, model) {
        var _this = this;
        this.view = view;
        this.model = model;
        this.view.accordion(Styles.accordionSettings).find('input').button().change(function () {
            return _this.viewToModel();
        });

        this.model.change(function (newValue, oldValue) {
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

/// Die Auswahl der Sprache erfolgt durch eine Reihe von Alternativen
var LanguageFilterController = (function () {
    function LanguageFilterController(view, model, getLanguageName) {
        var _this = this;
        this.view = view;
        this.model = model;
        this.getLanguageName = getLanguageName;
        this.view.accordion(Styles.accordionSettings);

        this.languageMap = new LanguageSelectors(view.find('.container'), function () {
            return _this.viewToModel();
        });

        this.model.change(function (newValue, oldValue) {
            return _this.modelToView();
        });

        this.modelToView();
    }
    LanguageFilterController.prototype.viewToModel = function () {
        this.model.val(this.languageMap.val());
    };

    LanguageFilterController.prototype.modelToView = function () {
        var val = this.model.val();

        this.languageMap.val(val);

        this.view.find('.header').text(this.getLanguageName(val));
    };

    LanguageFilterController.prototype.initialize = function (languages) {
        this.languageMap.initialize(languages);
    };

    LanguageFilterController.prototype.setCounts = function (languages) {
        this.languageMap.setCounts(languages);
    };
    return LanguageFilterController;
})();
//# sourceMappingURL=controllers.js.map

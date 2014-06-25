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

/// Die Auswahl der Sprache erfolgt durch eine Reihe von Alternativen
var LanguageFilterController = (function () {
    function LanguageFilterController(view) {
        var _this = this;
        this.view = view;
        this.model = new LanguageFilterModel();
        this.view.accordion(Styles.accordionSettings);

        this.languageMap = new LanguageSelectors(view.find('.container'), function () {
            return _this.viewToModel();
        });

        this.model.change(function () {
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

        this.view.find('.header').text(this.languageMap.lookupLanguageName(val) || '(egal)');
    };

    LanguageFilterController.prototype.initialize = function (languages) {
        this.languageMap.initialize(languages);
    };

    LanguageFilterController.prototype.setCounts = function (languages) {
        this.languageMap.setCounts(languages);
    };
    return LanguageFilterController;
})();

// Bei den Kategorien ist im Filter eine Mehrfachauswahl möglich
var GenreFilterController = (function () {
    function GenreFilterController(view) {
        var _this = this;
        this.view = view;
        this.model = new GenreFilterModel();
        this.view.accordion(Styles.accordionSettings);

        this.genreMap = new GenreSelectors(view.find('.container'), function () {
            return _this.viewToModel();
        });

        this.model.change(function () {
            return _this.modelToView();
        });

        this.modelToView();
    }
    GenreFilterController.prototype.viewToModel = function () {
        this.model.val(this.genreMap.val());
    };

    GenreFilterController.prototype.modelToView = function () {
        var _this = this;
        var genres = this.model.val();

        this.genreMap.val(genres);

        if (genres.length < 1)
            this.view.find('.header').text('(egal)');
        else
            this.view.find('.header').text($.map(genres, function (genre) {
                return _this.genreMap.lookupGenreName(genre);
            }).join(' und '));
    };

    GenreFilterController.prototype.initialize = function (genres) {
        this.genreMap.initialize(genres);
    };

    GenreFilterController.prototype.setCounts = function (genres) {
        this.genreMap.setCounts(genres);
    };
    return GenreFilterController;
})();
//# sourceMappingURL=controllers.js.map

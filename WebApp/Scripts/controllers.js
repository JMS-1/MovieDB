// Die Auswahl des Verleihers wird über drei separate Optionsfelder realisiert
var RentFilterController = (function () {
    function RentFilterController(view, model) {
        var _this = this;
        var accordionSettings = {
            active: false,
            animate: false,
            collapsible: true,
            heightStyle: 'content'
        };

        view.accordion(accordionSettings).find('input').button().change(function () {
            return _this.viewToModel(view, model);
        });

        model.change(function (newValue, oldValue) {
            return _this.modelToView(model, view);
        });

        this.modelToView(model, view);
    }
    RentFilterController.prototype.viewToModel = function (view, model) {
        var choice = view.find(':checked').val();
        if (choice.length < 1)
            model.val(null);
        else
            model.val(choice == '1');
    };

    RentFilterController.prototype.modelToView = function (model, view) {
        var val = model.val();
        var value = (val == null) ? '' : (val ? '1' : '0');
        var selected = view.find('input[value="' + value + '"]').prop('checked', true);

        view.find('input').button('refresh');

        if (val == null)
            view.find('.header').text('(egal)');
        else
            view.find('.header').text(val ? 'nur verliehene' : 'nur nicht verliehene');
    };
    return RentFilterController;
})();
//# sourceMappingURL=controllers.js.map

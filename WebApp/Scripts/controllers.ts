
// Die Auswahl des Verleihers wird über drei separate Optionsfelder realisiert
class RentFilterController {
    constructor(view: JQuery, model: RentFilterModel) {
        var accordionSettings = {
            active: false,
            animate: false,
            collapsible: true,
            heightStyle: 'content',
        };

        view
            .accordion(accordionSettings)
            .find('input')
            .button()
            .change(() => this.viewToModel(view, model));

        model.change((newValue, oldValue) => this.modelToView(model, view));

        this.modelToView(model, view);
    }

    private viewToModel(view: JQuery, model: RentFilterModel) {
        var choice: string = view.find(':checked').val();
        if (choice.length < 1)
            model.val(null);
        else
            model.val(choice == '1');
    }

    private modelToView(model: RentFilterModel, view: JQuery): void {
        var val = model.val();
        var value = (val == null) ? '' : (val ? '1' : '0');
        var selected = view.find('input[value="' + value + '"]').prop('checked', true);

        view.find('input').button('refresh');

        if (val == null)
            view.find('.header').text('(egal)');
        else
            view.find('.header').text(val ? 'nur verliehene' : 'nur nicht verliehene');
    }
}

// Die Auswahl des Verleihers wird über drei separate Optionsfelder realisiert
class RentFilterController {
    constructor(public view: JQuery, public model: RentFilterModel) {
        this.view
            .accordion(Styles.accordionSettings)
            .find('input')
            .button()
            .change(() => this.viewToModel());

        this.model.change((newValue, oldValue) => this.modelToView());

        this.modelToView();
    }

    private viewToModel() {
        var choice: string = this.view.find(':checked').val();
        if (choice.length < 1)
            this.model.val(null);
        else
            this.model.val(choice == '1');
    }

    private modelToView(): void {
        var val = this.model.val();
        var value = (val == null) ? '' : (val ? '1' : '0');

        this.view.find('input[value="' + value + '"]').prop('checked', true);
        this.view.find('input').button('refresh');

        if (val == null)
            this.view.find('.header').text('(egal)');
        else
            this.view.find('.header').text(val ? 'nur verliehene' : 'nur nicht verliehene');
    }
}

/// Die Auswahl der Sprache erfolgt durch eine Reihe von Alternativen
class LanguageFilterController {
    constructor(public view: JQuery, public model: LanguageFilterModel, private getLanguageName: (identifier: string) => string) {
        this.view.accordion(Styles.accordionSettings);
        
        this.languageMap = new LanguageSelectors(view.find('.container'), () => this.viewToModel());

        this.model.change((newValue, oldValue) => this.modelToView());

        this.modelToView();
    }

    private languageMap: LanguageSelectors;

    private viewToModel() {
        this.model.val(this.languageMap.val());
    }

    private modelToView(): void {
        var val = this.model.val();

        this.languageMap.val(val);

        this.view.find('.header').text(this.getLanguageName(val));
    }

    initialize(languages: ILanguageContract[]): void {
        this.languageMap.initialize(languages);
    }

    setCounts(languages: ILanguageStatisticsContract[]): void {
        this.languageMap.setCounts(languages);
    }
}
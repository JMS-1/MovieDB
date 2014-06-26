
// Die Auswahl des Verleihers wird über drei separate Optionsfelder realisiert
class RentFilterController {
    private model = new RentFilterModel();

    constructor(private view: JQuery) {
        this.view
            .accordion(Styles.accordionSettings)
            .find('input')
            .button()
            .change(() => this.viewToModel());

        this.model.change(() => this.modelToView());

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

// Beschreibt die Auswahl aus eine Liste von Alternativen
class RadioGroupController<TModelType extends IModel<string>> {
    private radios: any = {};

    constructor(public model: TModelType, private groupView: JQuery, private groupName: string) {
        this.groupView.change(() => this.viewToModel());

        this.model.change(() => this.modelToView());
    }

    viewToModel() {
        this.model.val(this.val());
    }

    modelToView(): void {
        this.val(this.model.val());
    }

    initialize(models: IMappingContract[]): void {
        this.groupView.empty();
        this.radios = {};

        this.radios[''] = new RadioView({ id: '', name: '(egal)' }, this.groupView, this.groupName);

        $.each(models, (index, model) => this.radios[model.id] = new RadioView(model, this.groupView, this.groupName));

        this.val(null);
    }

    setCounts(statistics: IStatisticsContract[]): void {
        $.each(this.radios, (key, stat: RadioView) => stat.reset());
        $.each(statistics, (index, stat) => (<RadioView>this.radios[stat.id]).setCount(stat.count));
    }

    getName(id: string): string {
        var radio: RadioView = this.radios[id || ''];
        if (radio == null)
            return null;
        else
            return radio.model.name;
    }

    val(): string;

    val(id: string): string;

    val(id: string = undefined): any {
        if (id !== undefined) {
            var radio: RadioView = this.radios[id || ''];
            if (radio != null)
                radio.check();
        }

        return this.groupView.find(':checked').val();
    }
}

// Beschreibt eine Mehrfachauswahl
class CheckGroupController<TModelType extends IModel<string[]>> {
    private checks: any = {};

    constructor(public model: TModelType, public container: JQuery, private groupName: string) {
        this.model.change(() => this.modelToView());
    }

    initialize(models: IMappingContract[]): void {
        this.container.empty();
        this.checks = {};

        $.each(models, (index, model) => this.checks[model.id] = new CheckView(model, this.container, () => this.viewToModel(), this.groupName));
    }

    setCounts(statistics: IStatisticsContract[]): void {
        $.each(this.checks, (key, check: CheckView) => check.reset());
        $.each(statistics, (index, check) => (<CheckView>this.checks[check.id]).setCount(check.count));
    }

    getName(genre: string): string {
        var check = <CheckView>this.checks[genre];
        if (check == null)
            return null;
        else
            return check.model.name;
    }

    viewToModel() {
        this.model.val(this.val());
    }

    modelToView(): void {
        this.val(this.model.val());
    }

    val(): string[];

    val(ids: string[]): string[];

    val(ids: string[]= undefined): any {
        if (ids !== undefined) {
            var newValue: any = {};

            $.each(ids, (index, id) => newValue[id] = true);

            for (var id in this.checks) {
                var check = <CheckView>this.checks[id];

                check.check(newValue[check.model.id] || false);
            }
        }

        var selected: string[] = [];

        for (var id in this.checks) {
            var check = <CheckView>this.checks[id];

            if (check.isChecked())
                selected.push(check.model.id);
        }

        return selected;
    }
}

// Die Auswahl der Sprache erfolgt durch eine Reihe von Alternativen
class LanguageFilterController extends RadioGroupController<LanguageFilterModel> {
    constructor(private view: JQuery) {
        super(new LanguageFilterModel(), view.find('.container'), 'languageChoice');

        this.view.accordion(Styles.accordionSettings);

        this.modelToView();
    }

    modelToView(): void {
        super.modelToView();

        this.view.find('.header').text(this.getName(this.model.val()) || '(egal)');
    }
}

// Bei den Kategorien ist im Filter eine Mehrfachauswahl möglich
class GenreFilterController extends CheckGroupController<GenreFilterModel> {
    constructor(private view: JQuery) {
        super(new GenreFilterModel(), view.find('.container'), 'genreCheckbox');

        this.view.accordion(Styles.accordionSettings);

        this.modelToView();
    }

    modelToView(): void {
        super.modelToView();

        var genres = this.model.val();

        if (genres.length < 1)
            this.view.find('.header').text('(egal)');
        else
            this.view.find('.header').text($.map(genres, genre => this.getName(genre)).join(' und '));
    }
}

// Die Steuerung der Hierarchien
class TreeController {
}

class TreeNodeController extends TreeController {
    children: TreeController[] = [];

    constructor(private model: TreeNodeModel, public view: TreeNodeView) {
        super();

        this.view.toggle = () => this.model.expanded(!this.model.expanded());
        this.view.click = () => this.model.selected(!this.model.selected());
        this.model.changed = () => this.modelExpanded();
        this.model.select = () => this.modelSelected();

        this.modelExpanded();
    }

    private modelExpanded(): void {
        this.view.expanded(this.model.expanded());
    }

    private modelSelected(): void {
        this.view.selected(this.model.selected());
    }
}

class TreeLeafController extends TreeController {
    constructor(public model: TreeLeafModel, public view: TreeLeafView) {
        super();

        this.view.click = () => this.model.selected(!this.model.selected());
        this.model.select = () => this.modelSelected();
    }

    private modelSelected(): void {
        this.view.selected(this.model.selected());
    }
}
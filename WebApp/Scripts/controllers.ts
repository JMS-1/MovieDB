
// Das Freitextfeld ist wirklich nur ein Textfeld, allerdings mit einer zeitgesteuerten automatischen Suche
class TextFilterController {
    model = new Model<string>(null);

    elapsed = () => { };

    // Gesetzt, wenn die automatische Suche nach der Eingabe eines Suchtextes aktiviert ist
    private timeout: number = null;

    constructor(private view: JQuery) {
        this.view.on('keypress', () => this.viewToModel());
        this.view.on('change', () => this.viewToModel());
        this.view.on('input', () => this.viewToModel());

        this.model.change(() => this.modelToView());

        this.modelToView();
    }

    private viewToModel(): void {
        this.stop();

        this.model.val(this.view.val());

        this.timeout = window.setTimeout(() => this.elapsed(), 300);
    }

    // Asynchrone automatische Suche deaktivieren
    stop(): void {
        if (this.timeout != null)
            window.clearTimeout(this.timeout);

        this.timeout = null;
    }

    private modelToView(): void {
        this.view.val(this.model.val());
    }
}

// Die Auswahl des Verleihers wird über drei separate Optionsfelder realisiert
class RentFilterController {
    model = new Model<boolean>(null);

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
            this.view.find('.ui-accordion-header>span').text('(egal)');
        else
            this.view.find('.ui-accordion-header>span').text(val ? 'nur verliehene' : 'nur nicht verliehene');
    }
}

// Beschreibt die Auswahl aus eine Liste von Alternativen
class RadioGroupController {
    model = new Model<string>(null);

    private radios: any = {};

    constructor(public groupView: JQuery, private groupName: string) {
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
        this.fillView(this.groupView, models);
    }

    fillView(view: JQuery, models: IMappingContract[]): void {
        view.empty();

        this.radios = {};
        this.radios[''] = new RadioView({ id: '', name: '(egal)' }, view, this.groupName);

        $.each(models, (index, model) => this.radios[model.id] = new RadioView(model, view, this.groupName));

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
class CheckGroupController {
    model = new Model<string[]>([]);

    private checks: any = {};

    constructor(public groupView: JQuery, private groupName: string) {
        this.model.change(() => this.modelToView());
    }

    initialize(models: IMappingContract[]): void {
        this.fillView(this.groupView, models);
    }

    fillView(view: JQuery, models: IMappingContract[]): void {
        view.empty();

        this.checks = {};

        $.each(models, (index, model) => this.checks[model.id] = new CheckView(model, view, () => this.viewToModel(), this.groupName));
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
class LanguageFilterController extends RadioGroupController {
    constructor(private view: JQuery) {
        super(view, 'languageChoice');

        this.view.accordion(Styles.accordionSettings);

        this.modelToView();
    }

    modelToView(): void {
        super.modelToView();

        this.view.find('.ui-accordion-header>span').text(this.getName(this.model.val()) || '(egal)');
    }

    initialize(models: IMappingContract[]): void {
        this.fillView(this.groupView.find('.ui-accordion-content'), models);
    }
}

// Bei den Kategorien ist im Filter eine Mehrfachauswahl möglich
class GenreFilterController extends CheckGroupController {
    constructor(private view: JQuery) {
        super(view, 'genreCheckbox');

        this.view.accordion(Styles.accordionSettings);

        this.modelToView();
    }

    modelToView(): void {
        super.modelToView();

        var genres = this.model.val();

        if (genres.length < 1)
            this.view.find('.ui-accordion-header>span').text('(egal)');
        else
            this.view.find('.ui-accordion-header>span').text($.map(genres, genre => this.getName(genre)).join(' und '));
    }

    initialize(models: IMappingContract[]): void {
        this.fillView(this.groupView.find('.ui-accordion-content'), models);
    }
}

// Serien werden über einen Baum ausgewählt
class SeriesFilterController {
    model = new Model<string>(null);

    private nextReset = 0;

    private search: string;

    private nodes: TreeController[] = [];

    private container: JQuery;

    constructor(private view: JQuery) {
        this.view.accordion(Styles.accordionSettings).on('accordionactivate', (event, ui) => {
            if (ui.newPanel.length > 0)
                this.activate();
        });

        this.container = this.view.find('.ui-accordion-content');
        this.container.keypress(ev => this.onKeyPressed(ev));
        this.model.change(() => this.modelToView());

        this.modelToView();
    }

    private modelToView() {
        var selected = this.model.val();
        var name = '(egal)';

        $.each(this.nodes, (index, node) => node.foreach(target => {
            if (target.model.selected.val(target.model.id == selected))
                name = target.model.fullName;
        }, null));

        this.view.find('.ui-accordion-header>span').text(name);
    }

    // Ein Tastendruck führt im allgemeinen dazu, dass sich die Liste auf den ersten Eintrag mit einem passenden Namen verschiebt
    private onKeyPressed(ev: JQueryEventObject): void {
        // Tasten innerhalb eines Zeitraums von einer Sekunde werden zu einem zu vergleichenden Gesamtpräfix zusammengefasst
        var now = $.now();
        if (now >= this.nextReset)
            this.search = '';

        this.search = (this.search + ev.char).toLowerCase();
        this.nextReset = now + 1000;

        // Wir suchen erst einmal nur nach den Namen auf der obersten Ebene, das sollte für fast alles reichen
        for (var i = 0; i < this.nodes.length; i++) {
            var node = this.nodes[i];
            var name = node.model.fullName;

            // Der Vergleich ist wirklich etwas faul und dient wirklich nur zum grob anspringen
            if (name.length >= this.search.length)
                if (name.substr(0, this.search.length).toLowerCase() == this.search) {
                    this.scrollTo(node, []);

                    ev.preventDefault();

                    return;
                }
        }
    }

    // Wenn das jQuery UI Accordion geöffnet wirde, müssen wir irgendwie einen sinnvollen Anfangszustand herstellen
    private activate(): void {
        this.container.focus();
        this.nextReset = 0;

        // Stellt sicher, dass die aktuell ausgewählte Serie ganz oben angezeigt wird
        $.each(this.nodes, (index, node) => node.foreach((target, path) => {
            if (target.model.selected.val())
                this.scrollTo(target, path);
        }, null));
    }

    // Stellt sicher, dass eine beliebige Serie ganz oben dargestellt wird
    private scrollTo(selected: TreeController, path: TreeNodeController[]): void {
        // Wir klappen den Baum immer bis zur Auswahl auf
        $.each(path, (index, node) => node.nodeModel.expanded.val(true));

        // Und dann verschieben wir das Sichtfenster so, dass die ausgewählte Serie ganz oben steht - ja, das kann man sicher eleganter machen
        if (path.length > 0)
            selected = path[0];

        var firstTop = this.container.children().first().offset().top;
        var selectedTop = selected.view.text.offset().top;

        this.container.scrollTop(selectedTop - firstTop);
    }

    // Hebt die aktuelle Auswahl auf
    resetFilter(allbut: TreeController = null): void {
        $.each(this.nodes, (index, node) => node.foreach((target, path) => target.model.selected.val(false), allbut));
    }

    // Baut die Hierarchie der Serien auf
    initialize(series: ISeriesMapping[]): void {
        this.container.empty();

        this.nodes = SeriesFilterController.buildTree(series.filter(s => s.parentId == null), this.container);

        $.each(this.nodes, (index, node) => node.click(target => this.itemClick(target)));
    }

    // Wird wärend der Änderung der Auswahl gesetzt
    private selecting = false;

    // Wird immer dann ausgelöst, wenn ein Knoten oder Blatt angeklick wurde
    private itemClick(target: TreeController): void {
        if (this.selecting)
            return;

        this.selecting = true;
        try {
            // In der aktuellen Implementierung darf immer nur eine einzige Serie ausgewählt werden
            this.resetFilter(target);

            var model = target.model;
            if (model.selected.val())
                this.model.val(model.id);
            else
                this.model.val(null);
        }
        finally {
            this.selecting = false;
        }
    }

    // Baut ausgehend von einer Liste von Geschwisterserien den gesamten Baum unterhalb dieser Serien auf
    private static buildTree(children: ISeriesMapping[], parent: JQuery): TreeController[] {
        return $.map(children, item => {
            // Blätter sind einfach
            if (item.children.length < 1)
                return new TreeLeafController(new TreeLeafModel(item), new TreeLeafView(item.name, item.parentId == null, parent));

            // Bei Knoten müssen wir etwas mehr tun
            var node = new TreeNodeController(new TreeNodeModel(item), new TreeNodeView(item.name, item.parentId == null, parent));

            // Für alle untergeordeneten Serien müssen wir eine entsprechende Anzeige vorbereiten
            node.children = this.buildTree(item.children, node.nodeView.childView);

            return <TreeController>node;
        });
    }
}

// Die Steuerung der Hierarchien
class TreeController {
    constructor(public model: TreeItemModel, public view: TreeItemView) {
    }

    selected = (target: TreeController) => { };

    click(callback: (target: TreeController) => void): void {
        this.selected = callback;
    }

    foreach(callback: (target: TreeController, path: TreeNodeController[]) => void, allbut: TreeController, path: TreeNodeController[]= []): void {
        if (allbut !== this)
            callback(this, path);
    }
}

class TreeNodeController extends TreeController {
    children: TreeController[] = [];

    constructor(public nodeModel: TreeNodeModel, public nodeView: TreeNodeView) {
        super(nodeModel, nodeView);

        this.nodeView.toggle = () => this.nodeModel.expanded.val(!this.nodeModel.expanded.val());
        this.view.click = () => this.nodeModel.selected.val(!this.nodeModel.selected.val());
        this.nodeModel.expanded.change(() => this.modelExpanded());
        this.nodeModel.selected.change(() => this.modelSelected());

        this.modelExpanded();
    }

    private modelExpanded(): void {
        this.nodeView.expanded(this.nodeModel.expanded.val());
    }

    private modelSelected(): void {
        this.view.selected(this.nodeModel.selected.val());
        this.selected(this);
    }

    click(callback: (target: TreeController) => void): void {
        super.click(callback);

        $.each(this.children, (index, child) => child.click(callback));
    }

    foreach(callback: (target: TreeController, path: TreeNodeController[]) => void, allbut: TreeController, path: TreeNodeController[]= []): void {
        super.foreach(callback, allbut);

        path.push(this);

        $.each(this.children, (index, child) => child.foreach(callback, allbut, path));

        path.pop();
    }
}

class TreeLeafController extends TreeController {
    constructor(public leafModel: TreeLeafModel, public leafView: TreeLeafView) {
        super(leafModel, leafView);

        this.view.click = () => this.leafModel.selected.val(!this.leafModel.selected.val());
        this.leafModel.selected.change(() => this.modelSelected());
    }

    private modelSelected(): void {
        this.view.selected(this.leafModel.selected.val());
        this.selected(this);
    }
}
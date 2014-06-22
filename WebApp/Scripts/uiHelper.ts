﻿/// <reference path='typings/jquery/jquery.d.ts' />
/// <reference path='typings/jqueryui/jqueryui.d.ts' />
/// <reference path='interfaces.ts' />

class Styles {
    static invisble = 'invisible';

    static loading = 'ui-icon-power';

    static busy = 'ui-icon-refresh';

    static idle = 'ui-icon-check';

    static expanded = 'ui-icon-circlesmall-minus';

    static collapsed = 'ui-icon-circlesmall-plus';

    static pageButton = 'pageButton';

    static activePageButton = 'pageButtonSelected';

    static disabledOption = 'disabledOption';

    static notSorted = 'ui-icon-arrowthick-2-n-s';

    static sortedUp = 'ui-icon-arrowthick-1-n';

    static sortedDown = 'ui-icon-arrowthick-1-s';

    static inputError = 'validationError';

    static deleteConfirmation = 'deleteConfirm';

    static treeNode = 'treeNode';

    static nodeHeader = 'treeNodeHeader';

    static isNode = 'nodeInTree';

    static isLeaf = 'leafInTree';

    static selectedNode = 'nodeSelected';
}

class Tools {
    static setError(field: JQuery, message: string): boolean {
        if (message == null) {
            field.removeClass(Styles.inputError);
            field.removeAttr('title');

            return false;
        }
        else {
            field.addClass(Styles.inputError);
            field.attr('title', message);

            return true;
        }
    }

    static fillMappingSelection(selector: JQuery, items: IMappingContract[], nullSelection: string): void {
        Tools.fillSelection(selector, items, nullSelection, item => item.id, item=> item.name);
    }

    static fillSeriesSelection(selector: JQuery, series: ISeriesMappingContract[], nullSelection: string): void {
        Tools.fillSelection(selector, series, nullSelection, s => s.id, s=> s.hierarchicalName);
    }

    static fillSelection<T>(selector: JQuery, items: T[], nullSelection: string, getValue: (item: T) => string, getText: (item: T) => string): void {
        selector.empty();

        $('<option />', { text: nullSelection, value: '' }).appendTo(selector);

        $.each(items, (index, item) => $('<option />', { text: getText(item), value: getValue(item) }).appendTo(selector));
    }

    static checkCollision(selector: JQuery, name: string, identifier: string): boolean {
        var existing = selector.find('option');

        for (var i = 1; i < existing.length; i++)
            if (existing[i].innerHTML == name)
                if (existing[i].getAttribute('value') != identifier)
                    return true;

        return false;
    }

    static openDialog(dialog: JQuery): void {
        dialog.dialog({
            position: { of: '#main', at: 'center top+100', my: 'center top' },
            closeOnEscape: false,
            width: 'auto',
            modal: true,
        });
    }
}

class GenreSelector {
    constructor(genre: IGenreContract, container: JQuery, onChange: () => void) {
        var id = 'genreCheckbox' + genre.id;

        this.checkbox = $('<input />',
            {
                'class': 'filterGenreToggle',
                type: 'checkbox',
                name: genre.id,
                id: id,
            })
            .appendTo(container)
            .change(onChange)
            .attr('data-text', genre.name);

        this.label = $('<label />', { 'for': id, text: genre.name }).appendTo(container);
        this.description = genre.name;

        this.checkbox.button();
    }

    private checkbox: JQuery;

    private label: JQuery;

    private description: string;

    reset(): void {
        if (this.checkbox.prop('checked')) {
            this.label.removeClass(Styles.invisble);
            this.checkbox.removeClass(Styles.invisble);
        }
        else {
            this.label.addClass(Styles.invisble);
            this.checkbox.addClass(Styles.invisble);
        }
    }

    setCount(count: number): void {
        this.label.text(this.description + ' (' + count + ')');

        this.checkbox.removeClass(Styles.invisble);
        this.label.removeClass(Styles.invisble);
    }
}

class GenreSelectors {
    private genres: any = {};

    container: JQuery;

    constructor(containerSelector: string) {
        this.container = $(containerSelector);
    }

    initialize(genres: IGenreContract[], onChange: () => void): void {
        this.container.empty();
        this.genres = {};

        $.each(genres, (index, genre) => this.genres[genre.id] = new GenreSelector(genre, this.container, onChange));
    }

    setCounts(statistics: IGenreStatisticsContract[]): void {
        $.each(this.genres, (key, genre: GenreSelector) => genre.reset());
        $.each(statistics, (index, genre) => (<GenreSelector>this.genres[genre.id]).setCount(genre.count));
    }

    resetFilter(): void {
        this.foreachSelected(checkbox => checkbox.prop('checked', false).button('refresh'));
    }

    foreachSelected(processor: (checkbox: JQuery) => void): void {
        this.container.find('input[type=checkbox]:checked').each((index, checkbox) => processor($(checkbox)));
    }
}

class LanguageSelector {
    static optionGroupName = 'languageChoice';

    constructor(language: ILanguageContract, container: JQuery) {
        var id = 'languageOption' + language.id;

        this.radio = $('<input />', { type: 'radio', id: id, name: LanguageSelector.optionGroupName, value: language.id }).appendTo(container);
        this.label = $('<label />', { 'for': id, text: language.name }).appendTo(container);
        this.description = language.name;
    }

    private radio: JQuery;

    private label: JQuery;

    private description: string;

    reset(): void {
        if (this.radio.prop('checked')) {
            this.label.removeClass(Styles.invisble);
            this.radio.removeClass(Styles.invisble);
        }
        else {
            this.label.addClass(Styles.invisble);
            this.radio.addClass(Styles.invisble);
        }
    }

    setCount(count: number): void {
        this.label.text(this.description + ' (' + count + ')');

        this.radio.removeClass(Styles.invisble);
        this.label.removeClass(Styles.invisble);
    }
}

class LanguageSelectors {
    private languages: any = {};

    container: JQuery;

    constructor(containerSelector: string) {
        this.container = $(containerSelector);
    }

    initialize(languages: ILanguageContract[]): void {
        this.container.empty();
        this.languages = {};

        $('<input />', { type: 'radio', id: 'anyLanguageChoice', name: LanguageSelector.optionGroupName, value: '' }).appendTo(this.container);
        $('<label />', { 'for': 'anyLanguageChoice' }).appendTo(this.container);

        $.each(languages, (index, language) => this.languages[language.id] = new LanguageSelector(language, this.container));

        this.container.find('input').button();
        this.container.find('label').first().text('(egal)');

        this.resetFilter();
    }

    setCounts(statistics: ILanguageStatisticsContract[]): void {
        $.each(this.languages, (key, language: LanguageSelector) => language.reset());
        $.each(statistics, (index, language) => (<LanguageSelector>this.languages[language.id]).setCount(language.count));
    }

    resetFilter(): void {
        this.container.find('input').first().prop('checked', true);
        this.container.find('input').button('refresh');
    }
}

class SeriesSelectors {
    container: JQuery;

    constructor(containerSelector: string) {
        this.container = $(containerSelector);
    }

    resetFilter(): void {
        this.container.val(null);
    }

    initialize(series: ISeriesMappingContract[]): void {
        Tools.fillSeriesSelection(this.container, series, '(egal)');
    }
}

class SeriesTreeSelector {
    private container: JQuery;

    private whenChanged: (id: string, name: string) => void;

    constructor(containerSelector: string, onChanged: (id: string, name: string) => void) {
        this.container = $(containerSelector);
        this.whenChanged = onChanged;
    }

    toggled(event: JQueryEventObject, ui: JQueryUI.AccordionUIParams): void {
        if (ui.newPanel.length < 1)
            return;

        var selected = this.selected();
        if (selected.length < 1)
            return;

        var panelTop = ui.newPanel.position().top;
        var selectedTop = selected.position().top;

        ui.newPanel.scrollTop(selectedTop - panelTop);
    }

    resetFilter(): void {
        this.selected().removeClass(Styles.selectedNode);
    }

    initialize(series: ISeriesMapping[]): void {
        this.container.empty();

        this.buildTree(series.filter(s => s.parentId == null), this.container);
    }

    private selected(): JQuery {
        return this.container.find('.' + Styles.selectedNode);
    }

    private selectNode(node: JQuery): void {
        var wasSelected = node.hasClass(Styles.selectedNode);

        this.resetFilter();

        if (wasSelected)
            this.whenChanged(null, null);
        else {
            node.addClass(Styles.selectedNode);

            this.whenChanged(node.attr('data-id'), node.attr('data-name'));
        }

    }

    private buildTree(children: ISeriesMapping[], parent: JQuery): void {
        $.each(children, (index, item) => {
            var child = $('<div />').appendTo(parent);

            if (item.parentId != null)
                child.addClass(Styles.treeNode);

            if (item.children.length < 1) {
                child
                    .text(item.name)
                    .attr('data-id', item.id)
                    .attr('data-name', item.hierarchicalName)
                    .addClass(Styles.isLeaf)
                    .on('click', () => this.selectNode(child));
            } else {
                // Das kleine Symbol zum Auf- und Zuklappen muss auch noch rein
                var header =
                    $('<div />', { 'class': Styles.nodeHeader })
                        .appendTo(child);

                var toggle =
                    $('<div />', { 'class': 'ui-icon' })
                        .addClass(Styles.collapsed)
                        .appendTo(header);

                var headerText =
                    $('<div />')
                        .text(item.name)
                        .attr('data-id', item.id)
                        .attr('data-name', item.hierarchicalName)
                        .addClass(Styles.isNode)
                        .appendTo(header);

                headerText.on('click', ev => this.selectNode(headerText));

                // Dann erst die Unterserien
                var childContainer = $('<div />', { 'class': Styles.invisble }).appendTo(child);

                this.buildTree(item.children, childContainer);

                // Und wir müssen natürlich nicht auf die Änderung reagieren
                toggle.on('click', ev => {
                    if (ev.currentTarget !== ev.target)
                        return;

                    if (toggle.hasClass(Styles.expanded)) {
                        toggle.removeClass(Styles.expanded);
                        toggle.addClass(Styles.collapsed);

                        childContainer.addClass(Styles.invisble);
                    }
                    else {
                        toggle.removeClass(Styles.collapsed);
                        toggle.addClass(Styles.expanded);

                        childContainer.removeClass(Styles.invisble);
                    }
                });
            }

        });
    }
}

class MultiValueEditor<T extends IMappingContract> {
    constructor(containerSelector: string, onChange: () => void) {
        this.onChange = onChange;

        this.container = $(containerSelector);
        this.container.buttonset();
    }

    private static idCounter = 0;

    private onChange: () => void;

    container: JQuery;

    val(): string[];

    val(newVal: string[]): void;

    val(newVal?: string[]): string[] {
        if (newVal) {
            var map = {};
            $.each(newVal, (index, id) => map[id] = true);

            $.each(this.container.find('input[type=checkbox]'), (index, checkbox: HTMLInputElement) => {
                var selector = $(checkbox);

                selector.prop('checked', map[selector.val()] == true);
            });

            this.container.buttonset('refresh');

            return newVal;
        } else {
            var value: string[] = [];

            $.each(this.container.find('input[type=checkbox]:checked'), (index, checkbox: HTMLInputElement) => value.push($(checkbox).val()));

            return value;
        }
    }

    reset(items: T[]): void {
        // Zuerst merken wir uns mal die aktuelle Einstellung
        var previousValue = this.val();

        // Dann wird die Oberfläche zurück gesetzt
        this.container.empty();

        // Und ganz neu aufgebaut
        $.each(items, (index, item) => {
            var id = "mve" + (++MultiValueEditor.idCounter);

            var checkbox = $('<input />', { type: 'checkbox', id: id, value: item.id }).appendTo(this.container).click(() => this.onChange());
            var label = $('<label />', { 'for': id, text: item.name }).appendTo(this.container);
        });

        // Alle Werte, die wir ausgewählt haben, werden wieder aktiviert - sofern sie bekannt sind
        this.val(previousValue);
    }
}

// Diese Basisklasse unterstützt die Pflege der festen Auswahllisten für Sprachen und Arten von Aufzeichnungen
class SuggestionListEditor<TInfoContract extends IEditInfoContract, TUpdateContext extends IMappingContract> {
    constructor(openButtonSelector: string, reloadApplicationData: () => void) {
        this.reload = reloadApplicationData;

        this.confirmedDelete = new DeleteButton(this.dialog().find('.dialogDelete'), () => this.remove());

        $(openButtonSelector).click(() => this.open());

        this.saveButton().click(() => this.save());
        this.cancelButton().click(() => this.close());

        this.nameField().on('change', () => this.validate());
        this.nameField().on('input', () => this.validate());
        this.chooser().change(() => this.choose());
    }

    private reload: () => void;

    private identifier: string = null;

    private confirmedDelete: DeleteButton;

    private open(): void {
        // Vorher noch einmal schnell alles aufbereiten - eventuell erfolgt auch ein Aufruf an den Web Service
        this.chooser().val('');
        this.choose();

        Tools.openDialog(this.dialog());
    }

    private close() {
        this.dialog().dialog('close');
    }

    private restart(): void {
        this.close();

        // Wichtig ist, dass wir die neuen Listen in die Oberfläche laden
        this.reload();
    }

    private createUpdate(): TUpdateContext {
        var newData: IMappingContract =
            {
                name: (this.nameField().val() || '').trim(),
                id: null,
            };

        // Der Downcast ist etwas unsauber, aber wir wissen hier genau, was wir tun
        return <TUpdateContext>newData;
    }

    reset(list: TUpdateContext[]): void {
        Tools.fillSelection(this.chooser(), list, this.createNewOption(), i => i.id, i=> i.name);
    }

    private validate(newData: TUpdateContext = null): boolean {
        if (newData == null)
            newData = this.createUpdate();

        var isValid = true;

        var nameError = this.validateName(newData)
        if (nameError == null)
            if (Tools.checkCollision(this.chooser(), newData.name, this.identifier))
                nameError = "Der Name wird bereits verwendet";

        if (Tools.setError(this.nameField(), nameError))
            isValid = false;

        this.saveButton().button('option', 'disabled', !isValid);

        return isValid;
    }

    private choose(): void {
        // Die aktuelle Auswahl ermitteln
        var choosen: string = this.chooser().val();

        // Und dann ganz defensiv erst einmal alles zurück setzen
        this.saveButton().button('option', 'disabled', choosen.length > 0);

        this.confirmedDelete.disable();

        this.nameField().val('');

        if (choosen.length < 1) {
            // Einfach ist es, wenn wir etwas neu Anlegen
            this.identifier = '';

            this.validate();
        }
        else {
            // Ansonsten fragen wir den Web Service immer nach dem neuesten Stand
            this.identifier = null;

            $.ajax('movie/' + this.controllerName() + '/' + choosen).done((info: TInfoContract) => {
                if (info == null)
                    return;

                this.identifier = info.id;

                this.nameField().val(info.name);

                if (info.unused)
                    this.confirmedDelete.enable();

                // Für den unwahrscheinlichen Fall, dass sich die Spielregeln verändert haben - und um die Schaltfläche zum Speichern zu aktivieren
                this.validate();
            });
        }
    }

    private remove(): void {
        if (this.identifier == null)
            return;
        if (this.identifier.length < 1)
            return;

        $
            .ajax('movie/' + this.controllerName() + '/' + this.identifier, {
                type: 'DELETE',
            })
            .done(() => this.restart())
            .fail(() => {
                // Bei der Fehlerbehandlung ist noch Potential
                alert('Da ist leider etwas schief gegangen');
            });
    }

    private save(): void {
        if (this.identifier == null)
            return;

        var newData = this.createUpdate();

        // Vorsichtshalbe schauen wir noch einmal nach, ob das alles so in Ordnung geht
        if (!this.validate(newData))
            return;

        var url = 'movie/' + this.controllerName();
        if (this.identifier.length > 0)
            url += '/' + this.identifier;

        $
            .ajax(url, {
                type: (this.identifier.length < 1) ? 'POST' : 'PUT',
                contentType: 'application/json; charset=utf-8',
                data: JSON.stringify(newData),
            })
            .done(() => this.restart())
            .fail(() => {
                // Bei der Fehlerbehandlung ist noch Potential
                alert('Da ist leider etwas schief gegangen');
            });
    }

    // Alles was jetzt kommt sind eigentlich die abstrakten Methoden der Basisklasse

    controllerName(): string {
        throw 'Bitte controllerName implementieren';
    }

    createNewOption(): string {
        throw 'Bitte createNewOption implementieren';
    }

    dialog(): JQuery {
        throw 'Bitte dialog implementieren';
    }

    private chooser(): JQuery {
        return this.dialog().find('.selectKey');
    }

    private saveButton(): JQuery {
        return this.dialog().find('.dialogSave');
    }

    private cancelButton(): JQuery {
        return this.dialog().find('.dialogCancel');
    }

    private nameField(): JQuery {
        return this.dialog().find('.editName');
    }

    validateName(newData: TUpdateContext): string {
        throw 'Bitte validateName implementieren';
    }
}

class DeleteButton {
    public constructor(button: JQuery, process: () => void) {
        this.button = button.click(() => this.remove());
        this.process = process;
    }

    private button: JQuery;

    private process: () => void;

    disable(): void {
        this.button.removeClass(Styles.deleteConfirmation);
        this.button.button('option', 'disabled', true);
    }

    enable(): void {
        this.button.button('option', 'disabled', false);
    }

    private remove(): void {
        if (this.button.hasClass(Styles.deleteConfirmation))
            this.process();
        else
            this.button.addClass(Styles.deleteConfirmation);
    }
}
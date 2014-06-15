/// <reference path='typings/jquery/jquery.d.ts' />
/// <reference path='typings/jqueryui/jqueryui.d.ts' />
/// <reference path='interfaces.ts' />

class Styles {
    static invisble = 'invisible';

    static loading = 'ui-icon-power';

    static busy = 'ui-icon-refresh';

    static idle = 'ui-icon-check';

    static pageButton = 'pageButton';

    static activePageButton = 'pageButtonSelected';

    static disabledOption = 'disabledOption';

    static notSorted = 'ui-icon-arrowthick-2-n-s';

    static sortedUp = 'ui-icon-arrowthick-1-n';

    static sortedDown = 'ui-icon-arrowthick-1-s';

    static inputError = 'validationError';
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
}

class GenreSelector {
    constructor(genre: IGenreContract, container: JQuery, onChange: () => void) {
        var id = 'genreCheckbox' + genre.id;
        var block = $('<div class="withLabel" />').appendTo(container);

        this.checkbox = $('<input />', { type: 'checkbox', id: id, name: genre.id }).appendTo(block).change(onChange);
        this.label = $('<label />', { 'for': id, text: genre.description }).appendTo(block);
        this.description = genre.description;
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
        this.foreachSelected(checkbox => checkbox.prop('checked', false));
    }

    foreachSelected(processor: (checkbox: JQuery) => void): void {
        this.container.find('input[type=checkbox]:checked').each((index, checkbox) => processor($(checkbox)));
    }
}

class LanguageSelector {
    static optionGroupName = 'languageChoice';

    constructor(language: ILanguageContract, container: JQuery) {
        var id = 'languageOption' + language.id;
        var block = $('<div class="withLabel" />').appendTo(container);

        this.radio = $('<input />', { type: 'radio', id: id, name: LanguageSelector.optionGroupName, value: language.id }).appendTo(block);
        this.label = $('<label />', { 'for': id, text: language.description }).appendTo(block);
        this.description = language.description;
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

        var block = $('<div class="withLabel" />').appendTo(this.container);
        $('<input />', { type: 'radio', id: 'anyLanguageChoice', name: LanguageSelector.optionGroupName, value: '', checked: 'checked' }).appendTo(block);
        $('<label />', { 'for': 'anyLanguageChoice', text: '(egal)' }).appendTo(block);

        $.each(languages, (index, language) => this.languages[language.id] = new LanguageSelector(language, this.container));
    }

    setCounts(statistics: ILanguageStatisticsContract[]): void {
        $.each(this.languages, (key, language: LanguageSelector) => language.reset());
        $.each(statistics, (index, language) => (<LanguageSelector>this.languages[language.id]).setCount(language.count));
    }

    resetFilter(): void {
        this.container.find('input').first().prop('checked', true);
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
        this.container.empty();
        this.container.append(new Option('(egal)', ''));

        $.each(series, (index, mapping) => $(new Option(mapping.hierarchicalName, mapping.id)).appendTo(this.container));
    }
}

class MultiValueEditor<T> {
    constructor(containerSelector: string, onChange: () => void) {
        this.onChange = onChange;

        this.container = $(containerSelector);
        this.container.buttonset();
    }

    private static idCounter = 0;

    private onChange: () => void;

    container: JQuery;

    value(): string[];

    value(newVal: string[]): void;

    value(newVal?: string[]): string[] {
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

    reset(items: T[], idSelector: (item: T) => string, nameSelector: (item: T) => string): void {
        // Zuerst merken wir uns mal die aktuelle Einstellung
        var previousValue = this.value();

        // Dann wird die Oberfläche zurück gesetzt
        this.container.empty();

        // Und ganz neu aufgebaut
        $.each(items, (index, item) => {
            var id = "mve" + (++MultiValueEditor.idCounter);

            var checkbox = $('<input />', { type: 'checkbox', id: id, value: idSelector(item) }).appendTo(this.container).click(() => this.onChange());
            var label = $('<label />', { 'for': id, text: nameSelector(item) }).appendTo(this.container);
        });

        // Alle Werte, die wir ausgewählt haben, werden wieder aktiviert - sofern sie bekannt sind
        this.value(previousValue);
    }
}

// Diese Basisklasse unterstützt die Pflege der festen Auswahllisten für Sprachen und Arten von Aufzeichnungen
class SuggestionListEditor<TInfoContract extends IEditInfoContract, TUpdateContext extends IMappingContract> {
    constructor(openButtonSelector: string, reloadApplicationData: () => void) {
        this.reload = reloadApplicationData;

        $(openButtonSelector).click(() => this.open());

        this.saveButton().click(() => this.save());
        this.cancelButton().click(() => this.close());
        this.deleteButton().click(() => this.remove());

        this.descriptionField().on('change', () => this.validate());
        this.descriptionField().on('input', () => this.validate());
        this.nameField().on('change', () => this.validate());
        this.nameField().on('input', () => this.validate());
        this.chooser().change(() => this.choose());
    }

    private reload: () => void;

    private createNew: boolean = null;

    private open(): void {
        // Vorher noch einmal schnell alles aufbereiten - eventuell erfolgt auch ein Aufruf an den Web Service
        this.choose();

        this.dialog().dialog({
            position: { of: '#dialogAnchor', at: 'center top+20', my: 'center top' },
            closeOnEscape: false,
            width: 'auto',
            modal: true,
        });
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
                description: this.descriptionField().val().trim(),
                id: this.nameField().val().trim(),
            };

        // Der Downcast ist etwas unsauber, aber wir wissen hier genau, was wir tun
        return <TUpdateContext>newData;
    }

    reset(list: TUpdateContext[]): void {
        var chooser = this.chooser();

        chooser.empty();

        $(new Option(this.createNewOption(), '', true, true)).appendTo(chooser);

        $.each(list, (index, item) => $(new Option(item.description, item.id)).appendTo(chooser));
    }

    private validate(newData: TUpdateContext = null): boolean {
        if (newData == null)
            newData = this.createUpdate();

        var isValid = true;

        if (Tools.setError(this.nameField(), this.validateName(newData)))
            isValid = false;
        if (Tools.setError(this.descriptionField(), this.validateDescription(newData)))
            isValid = false;

        this.saveButton().button('option', 'disabled', !isValid);

        return isValid;
    }

    private choose(): void {
        // Die aktuelle Auswahl ermitteln
        var choosen: string = this.chooser().val();

        // Und dann ganz defensiv erst einmal alles zurück setzen
        this.saveButton().button('option', 'disabled', choosen.length > 0);
        this.deleteButton().button('option', 'disabled', true);

        this.nameField().prop('disabled', choosen.length > 0);
        this.nameField().val('');
        this.descriptionField().val('');

        if (choosen.length < 1) {
            // Einfach ist es, wenn wir etwas neu Anlegen
            this.createNew = true;

            this.validate();
        }
        else {
            // Ansonsten fragen wir den Web Service immer nach dem neuesten Stand
            this.createNew = null;

            $.ajax('movie/' + this.controllerName() + '/' + choosen).done((info: TInfoContract) => {
                if (info == null)
                    return;

                this.createNew = false;

                this.nameField().val(info.id);
                this.descriptionField().val(info.name);

                this.deleteButton().button('option', 'disabled', !info.unused);

                // Für den unwahrscheinlichen Fall, dass sich die Spielregeln verändert haben - und um die Schaltfläche zum Speichern zu aktivieren
                this.validate();
            });
        }
    }

    private remove(): void {
        if (this.createNew == null)
            return;
        if (this.createNew)
            return;

        var newData = this.createUpdate();

        $
            .ajax('movie/' + this.controllerName() + '/' + newData.id, {
                type: 'DELETE',
            })
            .done(() => this.restart())
            .fail(() => {
                // Bei der Fehlerbehandlung ist noch Potential
                alert('Da ist leider etwas schief gegangen');
            });
    }

    private save(): void {
        if (this.createNew == null)
            return;

        var newData = this.createUpdate();

        // Vorsichtshalbe schauen wir noch einmal nach, ob das alles so in Ordnung geht
        if (!this.validate(newData))
            return;

        var url = 'movie/' + this.controllerName();
        if (!this.createNew)
            url += '/' + newData.id;

        $
            .ajax(url, {
                type: this.createNew ? 'POST' : 'PUT',
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

    chooser(): JQuery {
        throw 'Bitte chooser implementieren';
    }

    saveButton(): JQuery {
        throw 'Bitte saveButton implementieren';
    }

    deleteButton(): JQuery {
        throw 'Bitte deleteButton implementieren';
    }

    cancelButton(): JQuery {
        throw 'Bitte cancelButton implementieren';
    }

    nameField(): JQuery {
        throw 'BittenameField  implementieren';
    }

    descriptionField(): JQuery {
        throw 'Bitte descriptionField implementieren';
    }

    validateName(newData: TUpdateContext): string {
        throw 'Bitte validateName implementieren';
    }

    validateDescription(newData: TUpdateContext): string {
        throw 'Bitte validateDescription implementieren';
    }
}

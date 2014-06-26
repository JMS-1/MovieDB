
// Mehr müssel wir über einen einzelnen Wert nicht wissen (Wert auslesen, Wert setzen, Änderungen überwachen)
interface IModel<TSimpleType> {
    change(callback: () => void): void;

    val(): TSimpleType;

    val(newValue: TSimpleType): TSimpleType;
}

// Basisklasse für ein einfaches Modell mit nur einem Wert
class Model<TModelType, TSimpleType> implements IModel<TSimpleType>{
    private onChange: { (): void }[] = [];

    // Hier kann sich ein Interessent an Änderungen des einzigen Wertes anmelden
    change(callback: () => void): void {
        if (callback != null)
            this.onChange.push(callback);
    }

    private onChanged(): void {
        $.each(this.onChange, (index, callback) => callback());
    }

    // Das wäre dann der einzige Wert
    private value: TSimpleType = null;

    val(): TSimpleType;

    val(newValue: TSimpleType): TSimpleType;

    val(newValue: TSimpleType = undefined): any {
        // Vielleicht will ja nur jemand den aktuellen Wert kennen lernen
        if (newValue !== undefined) {
            if (newValue != this.value) {
                this.value = newValue;

                // Wenn sich der Wert verändert hat, dann müssen wir alle Interessenten informieren
                this.onChanged();
            }
        }

        // Wir melden immer den nun aktuellen Wert
        return this.value;
    }
}

// Auswahl des Verleihers (verliehen / nicht verliehen / egal)
class RentFilterModel extends Model<RentFilterModel, boolean> {
}

// Die Auswahl der Sprache (eindeutige Kennung / egal)
class LanguageFilterModel extends Model<LanguageFilterModel, string> {
}

// Die Auswahl der Kategorien (Liste eindeutiger Kennungen)
class GenreFilterModel extends Model<GenreFilterModel, string[]> {
    constructor() {
        super();

        // Wir stellen sicher, dass immer ein (wenn auch leeres) Feld vorhanden ist
        super.val([]);
    }
}

class TreeItemModel {
    private isSelected = false;

    select = () => { };

    selected(): boolean;

    selected(isSelected: boolean): boolean;

    selected(isSelected: boolean = undefined): any {
        if (isSelected !== undefined)
            if (isSelected != this.isSelected) {
                this.isSelected = isSelected;

                this.select();
            }

        return this.isSelected;
    }
}

class TreeNodeModel extends TreeItemModel {
    private isExpanded = false;

    changed = () => { };

    constructor(data: ISeriesMapping) {
        super();
    }

    expanded(): boolean;

    expanded(isExpanded: boolean): boolean;

    expanded(isExpanded: boolean = undefined): any {
        if (isExpanded !== undefined)
            if (isExpanded != this.isExpanded) {
                this.isExpanded = isExpanded;

                this.changed();
            }

        return this.isExpanded;
    }
}

class TreeLeafModel extends TreeItemModel {
    constructor(data: ISeriesMapping) {
        super();
    }
}

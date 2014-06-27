
// Basisklasse für ein einfaches Modell mit nur einem Wert
class Model<TSimpleType> {
    private onChange: { (): void }[] = [];

    // Hier kann sich ein Interessent an Änderungen des einzigen Wertes anmelden
    change(callback: () => void): void {
        if (callback != null)
            this.onChange.push(callback);
    }

    private onChanged(): void {
        $.each(this.onChange, (index, callback) => callback());
    }

    constructor(initialValue: TSimpleType = null) {
        this.value = initialValue;
    }

    // Das wäre dann der einzige Wert
    private value: TSimpleType;

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
class RentFilterModel extends Model<boolean> {
}

// Die Auswahl der Sprache (eindeutige Kennung / egal)
class LanguageFilterModel extends Model<string> {
}

// Die Auswahl der Kategorien (Liste eindeutiger Kennungen)
class GenreFilterModel extends Model<string[]> {
    constructor() {
        super();

        // Wir stellen sicher, dass immer ein (wenn auch leeres) Feld vorhanden ist
        super.val([]);
    }
}

// Ein Element in einer hierarchischen Ansicht kann ausgewählt werden
class TreeItemModel {
    selected = new Model<boolean>(false);

    id: string;

    fullName: string;

    constructor(item: ISeriesMapping) {
        this.id = item.id;
        this.fullName = item.hierarchicalName;
    }
}

// Ein Blatt in einer hierarchischen Ansicht kann nur ausgewählt werden
class TreeLeafModel extends TreeItemModel {
    constructor(item: ISeriesMapping) {
        super(item);
    }
}

// Ein Knoten in einer hierarchischen Ansicht kann zusätzlicher zur Auswahl auch auf- und zugeklappt werden
class TreeNodeModel extends TreeItemModel {
    expanded = new Model<boolean>(false);

    constructor(item: ISeriesMapping) {
        super(item);
    }
}


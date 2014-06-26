
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

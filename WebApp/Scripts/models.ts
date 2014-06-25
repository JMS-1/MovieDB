
// Auswahl des Verleihers (verliehen / nicht verliehen / egal)
class RentFilterModel {
    private value: boolean = null

    private onChange: { (newValue: boolean, oldValue: boolean): void }[] = [];

    change(callback: (newValue: boolean, oldValue: boolean) => void): RentFilterModel {
        if (callback != null)
            this.onChange.push(callback);

        return this;
    }

    val(): boolean;

    val(newValue: boolean): boolean;

    val(newValue: boolean = undefined): any {
        // Vielleicht will ja nur jemand den aktuellen Wert kennen lernen
        if (newValue !== undefined) {
            var oldValue = this.value;
            if (newValue != oldValue) {
                this.value = newValue;

                // Wenn sich der Wert verändert hat, dann müssen wir alle Interessenten informieren
                $.each(this.onChange, (index, callback) => callback(newValue, oldValue));
            }
        }

        // Wir melden immer den nun aktuellen Wert
        return this.value;
    }
} 
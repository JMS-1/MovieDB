
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

// Die Auswahl der Sprache (eindeutige Kennung / egal)
class LanguageFilterModel {
    private value: string = null

    private onChange: { (newLanguage: string, oldLanguage: string): void }[] = [];

    change(callback: (newLanguage: string, oldLanguage: string) => void): LanguageFilterModel {
        if (callback != null)
            this.onChange.push(callback);

        return this;
    }

    val(): string;

    val(newLanguage: string): string;

    val(newLanguage: string = undefined): any {
        // Vielleicht will ja nur jemand den aktuellen Wert kennen lernen
        if (newLanguage !== undefined) {
            var oldLanguage = this.value;
            if (newLanguage != oldLanguage) {
                this.value = newLanguage;

                // Wenn sich der Wert verändert hat, dann müssen wir alle Interessenten informieren
                $.each(this.onChange, (index, callback) => callback(newLanguage, oldLanguage));
            }
        }

        // Wir melden immer den nun aktuellen Wert
        return this.value;
    }
}
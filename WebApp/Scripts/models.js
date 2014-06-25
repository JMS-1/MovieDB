// Auswahl des Verleihers (verliehen / nicht verliehen / egal)
var RentFilterModel = (function () {
    function RentFilterModel() {
        this.value = null;
        this.onChange = [];
    }
    RentFilterModel.prototype.change = function (callback) {
        if (callback != null)
            this.onChange.push(callback);

        return this;
    };

    RentFilterModel.prototype.val = function (newValue) {
        if (typeof newValue === "undefined") { newValue = undefined; }
        // Vielleicht will ja nur jemand den aktuellen Wert kennen lernen
        if (newValue !== undefined) {
            var oldValue = this.value;
            if (newValue != oldValue) {
                this.value = newValue;

                // Wenn sich der Wert verändert hat, dann müssen wir alle Interessenten informieren
                $.each(this.onChange, function (index, callback) {
                    return callback(newValue, oldValue);
                });
            }
        }

        // Wir melden immer den nun aktuellen Wert
        return this.value;
    };
    return RentFilterModel;
})();

// Die Auswahl der Sprache (eindeutige Kennung / egal)
var LanguageFilterModel = (function () {
    function LanguageFilterModel() {
        this.value = null;
        this.onChange = [];
    }
    LanguageFilterModel.prototype.change = function (callback) {
        if (callback != null)
            this.onChange.push(callback);

        return this;
    };

    LanguageFilterModel.prototype.val = function (newLanguage) {
        if (typeof newLanguage === "undefined") { newLanguage = undefined; }
        // Vielleicht will ja nur jemand den aktuellen Wert kennen lernen
        if (newLanguage !== undefined) {
            var oldLanguage = this.value;
            if (newLanguage != oldLanguage) {
                this.value = newLanguage;

                // Wenn sich der Wert verändert hat, dann müssen wir alle Interessenten informieren
                $.each(this.onChange, function (index, callback) {
                    return callback(newLanguage, oldLanguage);
                });
            }
        }

        // Wir melden immer den nun aktuellen Wert
        return this.value;
    };
    return LanguageFilterModel;
})();
//# sourceMappingURL=models.js.map

/// <reference path='typings/jquery/jquery.d.ts' />
var RentFilterModel = (function () {
    function RentFilterModel() {
        this.value = null;
        this.onChange = [];
    }
    RentFilterModel.prototype.val = function (newValue, notify) {
        if (typeof newValue === "undefined") { newValue = undefined; }
        if (typeof notify === "undefined") { notify = true; }
        if (newValue === undefined)
            return this.value;

        var oldValue = this.value;
        if (newValue == oldValue)
            return;

        this.value = newValue;

        if (notify)
            $.each(this.onChange, function (index, callback) {
                return callback(newValue, oldValue);
            });
    };

    RentFilterModel.prototype.change = function (callback) {
        if (callback != null)
            this.onChange.push(callback);
    };
    return RentFilterModel;
})();
//# sourceMappingURL=models.js.map

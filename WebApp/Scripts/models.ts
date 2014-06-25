/// <reference path='typings/jquery/jquery.d.ts' />

class RentFilterModel {
    private value: boolean = null

    private onChange: { (newValue: boolean, oldValue: boolean): void }[] = [];

    val(): boolean;

    val(newValue: boolean): void;

    val(newValue: boolean, notify: boolean): void;

    val(newValue: boolean = undefined, notify: boolean = true): any {
        if (newValue === undefined)
            return this.value;

        var oldValue = this.value;
        if (newValue == oldValue)
            return;

        this.value = newValue;

        if (notify)
            $.each(this.onChange, (index, callback) => callback(newValue, oldValue));
    }

    change(callback: (newValue: boolean, oldValue: boolean) => void): void {
        if (callback != null)
            this.onChange.push(callback);
    }
} 
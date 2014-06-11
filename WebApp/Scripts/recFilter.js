/// <reference path='typings/jquery/jquery.d.ts' />
/// <reference path='typings/jqueryui/jqueryui.d.ts' />
/// <reference path='interfaces.ts' />
/// <reference path='uiHelper.ts' />
var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};

var RecordingFilter = (function (_super) {
    __extends(RecordingFilter, _super);
    function RecordingFilter() {
        _super.apply(this, arguments);
        this.pending = 0;
    }
    RecordingFilter.propertyFilter = function (propertyName, propertyValue) {
        if (propertyName != 'pending')
            return propertyValue;

        return undefined;
    };

    RecordingFilter.prototype.send = function () {
        var _this = this;
        // Jede Suche bekommt eine neue Nummer und es wird immer nur das letzte Ergebnis ausgewertet
        var thisRequest = ++this.pending;

        return $.ajax('movie/db', {
            contentType: 'application/json; charset=utf-8',
            data: JSON.stringify(this, RecordingFilter.propertyFilter),
            dataType: 'json',
            type: 'POST'
        }).done(function (searchResult) {
            // Veraltete Ergebnisse überspringen wir einfach
            searchResult.ignore = (_this.pending != thisRequest);
            if (searchResult.ignore)
                return;

            if (searchResult == null)
                return;

            var recordings = searchResult.recordings;
            if (recordings == null)
                return;

            // Ein wenig Vorarbeit hübscht die Daten vom Web Service etwas auf: aus der Rohdarstellung des Datums machen wir ein Date Objekt
            $.each(recordings, function (index, recording) {
                return recording.created = new Date(recording.createdAsString);
            });
        });
    };
    return RecordingFilter;
})(SearchRequestContract);
//# sourceMappingURL=recFilter.js.map

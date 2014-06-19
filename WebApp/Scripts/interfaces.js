



// Die Eigenschaften, nach denen Aufzeichnungen sortiert werden können
var OrderSelector = (function () {
    function OrderSelector() {
    }
    OrderSelector.title = 'titleWithSeries';

    OrderSelector.created = 'date';
    return OrderSelector;
})();


;


var SearchRequestContract = (function () {
    function SearchRequestContract() {
        this.size = 15;
        this.page = 0;
        this.order = OrderSelector.title;
        this.ascending = true;
        this.genres = [];
        this.language = null;
        this.series = [];
        this.rent = null;
        this.text = null;
    }
    return SearchRequestContract;
})();
//# sourceMappingURL=interfaces.js.map

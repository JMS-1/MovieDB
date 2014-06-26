
// Die Informationen zu einer Tonspur
interface IMappingContract {
    id: string;

    name: string;
}

interface ILanguageContract extends IMappingContract {
}

interface IGenreContract extends IMappingContract {
}

interface IContainerContract extends IMappingContract {
}


// Die Minimalinformation zu einer Serie
interface ISeriesMappingContract {
    id: string;

    name: string;

    hierarchicalName: string;

    parentId: string;
}

interface ISeriesContract {
    parentId: string;

    name: string;

    description: string;
}

interface IContainerEditContract {
    name: string;

    description: string;

    type: number;

    parent: string;

    location: string;
}

// Die statistichen Hilfsinformationen

interface IStatisticsContract {
    id: string;

    count: string;
}

interface ILanguageStatisticsContract extends IStatisticsContract {
}

interface IGenreStatisticsContract extends IStatisticsContract {
}

// Die Beschreibung einer Aufnahme in der Tabelle - eine Kurzfassung
interface IRecordingInfoContract {
    id: string;

    title: string;

    rent: string;

    series: string;

    languages: string[];

    genres: string[];
}

interface IRecordingRowContract extends IRecordingInfoContract {
    createdAsString: string;
}

interface IRecordingEditContract extends IRecordingInfoContract {
    description: string;

    mediaType: number;

    container: string;

    location: string;
}

// Die Eigenschaften, nach denen Aufzeichnungen sortiert werden können
class OrderSelector {
    static title: string = 'titleWithSeries';

    static created: string = 'date';
}

// Das Ergebnis einer Suche so wie der Dienst sie meldet
interface ISearchInformationContract {
    size: number;

    page: number;

    total: number;

    recordings: IRecordingInfoContract[];

    genres: IGenreStatisticsContract[];

    languages: ILanguageStatisticsContract[];
}

// Einige Informationen zur Anwendungsumgebung
interface IApplicationInformationContract {
    empty: boolean;

    total: number;

    languages: ILanguageContract[];

    genres: IGenreContract[];

    series: ISeriesMappingContract[];

    containers: IContainerContract[];

    seriesSeparator: string;
};

// Die Eingangsinformationen zum Pflegen einer Kategorie
interface IEditInfoContract {
    id: string;

    name: string;

    unused: boolean;
}

interface IGenreEditInfoContract extends IEditInfoContract {
}

interface ILanguageEditInfoContract extends IEditInfoContract {
}

interface ISeriesEditInfoContract {
    id: string;

    parentId: string;

    name: string;

    description: string;

    unused: boolean;
}

interface IContainerRecordingContract {
    name: string;

    position: string;
}

interface IContainerEditInfoContract {
    id: string;

    name: string;

    description: string;

    type: number;

    parent: string;

    location: string;

    children: string[];

    recordings: IContainerRecordingContract[];
}

class SearchRequestContract {
    size: number = 15;

    page: number = 0;

    order: string = OrderSelector.title;

    ascending: boolean = true;

    genres: string[] = [];

    language: string = null;

    series: string[] = [];

    rent: boolean = null;

    text: string = null;
}



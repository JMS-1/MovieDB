// Die Informationen zu einer Tonspur
interface IMappingContract {
    id: string;

    description: string;
}

interface ILanguageContract extends IMappingContract {
}

// Die Information zu einer einzelnen Art von Aufnahme
interface IGenreContract extends IMappingContract {
}

// Die Minimalinformation zu einer Serie
interface ISeriesMappingContract {
    id: string;

    parentId: string;

    name: string;

    hierarchicalName: string;
}

interface ISeriesContract {
    parentId: string;

    name: string;

    description: string;
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

    containers: string[];

    seriesSeparator: string;
};

// Die Eingangsinformationen zum Pflegen einer Art von Aufzeichnung
interface IEditInfoContract {
    id: string;

    name: string;

    unused: boolean;
}

interface IGenreEditInfo extends IEditInfoContract {
}

interface ILanguageEditInfo extends IEditInfoContract {
}

interface ISeriesEditInfo {
    id: string;

    parentId: string;

    name: string;

    description: string;

    unused: boolean;
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



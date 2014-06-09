// Die Informationen zu einer Tonspur
interface ILanguage {
    id: string;

    description: string;
}

// Die Information zu eiuner einzelnen Art von Aufnahme
interface IGenre {
    id: string;

    description: string;
}

// Die Minimalinformation zu einer Serie
interface ISeriesMappingContract {
    id: string;

    parentId: string;

    name: string;

    hierarchicalName: string;
}

// Die statistichen Hilfsinformationen

interface IStatistics {
    id: string;

    count: string;
}

interface ILanguageStatistics extends IStatistics {
}

interface IGenreStatistics extends IStatistics {
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

interface IRecordingRow extends IRecordingInfoContract {
    createdAsString: string;
}

interface IRecordingEdit extends IRecordingInfoContract {
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

    genres: IGenreStatistics[];

    languages: ILanguageStatistics[];
}

// Einige Informationen zur Anwendungsumgebung
interface IApplicationInformationContract {
    empty: boolean;

    total: number;

    languages: ILanguage[];

    genres: IGenre[];

    series: ISeriesMappingContract[];

    seriesSeparator: string;
};

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



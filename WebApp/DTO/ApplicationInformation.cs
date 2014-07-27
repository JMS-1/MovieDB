using System.Runtime.Serialization;


namespace WebApp.DTO
{
    /// <summary>
    /// Informationen zum aktuellen Datenstand.
    /// </summary>
    [DataContract]
    public class ApplicationInformation
    {
        /// <summary>
        /// Gesetzt, wenn die Datenbank noch nicht initialisiert wurde.
        /// </summary>
        [DataMember( Name = "empty" )]
        public bool DatabaseIsEmpty { get; set; }

        /// <summary>
        /// Die gesamte Anzahl von Aufzeichnungen in der Datenbank.
        /// </summary>
        [DataMember( Name = "total" )]
        public int NumberOfRecordings { get; set; }

        /// <summary>
        /// Alle bekannten Sprache.
        /// </summary>
        [DataMember( Name = "languages" )]
        public LanguageDescription[] Languages { get; set; }

        /// <summary>
        /// Alle Arten von Aufzeichnungen.
        /// </summary>
        [DataMember( Name = "genres" )]
        public GenreDescription[] Genres { get; set; }

        /// <summary>
        /// Alle Serien.
        /// </summary>
        [DataMember( Name = "series" )]
        public SeriesDescription[] Series { get; set; }

        /// <summary>
        /// Die Namen aller Aufbewahrungen.
        /// </summary>
        [DataMember( Name = "containers" )]
        public ContainerDescription[] Containers { get; set; }

        /// <summary>
        /// Das Trennzeichen für die Trennung der einzelnen Ebenen in Serien.
        /// </summary>
        [DataMember( Name = "seriesSeparator" )]
        public char SeriesSeparator { get; set; }

        /// <summary>
        /// Der reguläre Ausdruck zum Erkennen von Verweisen.
        /// </summary>
        [DataMember( Name = "urlExpression" )]
        public string UrlMatchPattern { get; set; }

        /// <summary>
        /// Erstellt eine neue Anwendungsinformation.
        /// </summary>
        public ApplicationInformation()
        {
            SeriesSeparator = Models.Series.JoinCharacter;
            UrlMatchPattern = Models.Link.UrlMatchPattern;
        }
    }
}
using System.Runtime.Serialization;
using WebApp.Models;


namespace WebApp.DTO
{
    /// <summary>
    /// Beschreibt das Ergebnis einer Suche.
    /// </summary>
    [DataContract]
    public class SearchInformation
    {
        /// <summary>
        /// Die 0-basierte laufende Nummer der Ergebnisseite.
        /// </summary>
        [DataMember( Name = "page" )]
        public int PageIndex { get; set; }

        /// <summary>
        /// Die aktuelle Größe einer Ergebnisseite.
        /// </summary>
        [DataMember( Name = "size" )]
        public int PageSize { get; set; }

        /// <summary>
        /// Die gesamte Anzahl von zur Suche passenden Ergebnisse.
        /// </summary>
        [DataMember( Name = "total" )]
        public int TotalCount { get; set; }

        /// <summary>
        /// Alle Aufzeichnungen.
        /// </summary>
        [DataMember( Name = "recordings" )]
        public RecordingForTable[] Recordings { get; set; }

        /// <summary>
        /// Das Trennzeichen für die Trennung der einzelnen Ebenen in Serien.
        /// </summary>
        [DataMember( Name = "seriesSeparator" )]
        public char SeriesSeparator { get; set; }

        /// <summary>
        /// Erstellt eine neue Antwort.
        /// </summary>
        public SearchInformation()
        {
            SeriesSeparator = Series.JoinCharacter;
        }

    }
}
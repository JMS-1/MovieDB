using System.Runtime.Serialization;


namespace WebApp.Models
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
    }
}
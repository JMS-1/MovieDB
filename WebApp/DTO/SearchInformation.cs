using System;
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
        /// Beschreibt die Anzahl der Treffer pro Art der Aufzeichnung.
        /// </summary>
        [DataContract]
        public class Genre
        {
            /// <summary>
            /// Der Name der Art.
            /// </summary>
            [DataMember( Name = "id" )]
            public string Name { get; set; }

            /// <summary>
            /// Die Anzahl der Treffer.
            /// </summary>
            [DataMember( Name = "count" )]
            public int Count { get; set; }
        }

        /// <summary>
        /// Beschreibt die Anzahl der Treffer pro Sprache.
        /// </summary>
        [DataContract]
        public class Language
        {
            /// <summary>
            /// Die Sprache.
            /// </summary>
            [DataMember( Name = "id" )]
            public Guid Identifier { get; set; }

            /// <summary>
            /// Die Anzahl der Treffer.
            /// </summary>
            [DataMember( Name = "count" )]
            public int Count { get; set; }
        }

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
        /// Statistische Daten zu den Arten von Aufzeichnungen.
        /// </summary>
        [DataMember( Name = "genres" )]
        public Genre[] GenreStatistics { get; set; }

        /// <summary>
        /// Statistische Daten zu den Sprachen.
        /// </summary>
        [DataMember( Name = "languages" )]
        public Language[] LanguageStatistics { get; set; }
    }
}
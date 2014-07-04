using System;
using System.Collections.Generic;
using System.Xml.Serialization;


namespace MovieDB
{
    /// <summary>
    /// Beschreibt eine einzelne Aufzeichung.
    /// </summary>
    [
        Serializable,
        XmlType( "Recording" )
    ]
    public class Recording
    {
        /// <summary>
        /// Der Name der Aufzeichnung.
        /// </summary>
        public string Title { get; set; }

        /// <summary>
        /// Die Sprachen, in der die Aufzeichnung vorliegt.
        /// </summary>
        [XmlArrayItem( "Language" )]
        public readonly List<string> Languages = new List<string>();

        /// <summary>
        /// Eine Liste von Kategorien für die Aufzeichnung.
        /// </summary>
        [XmlArrayItem( "Genre" )]
        public readonly List<string> Genres = new List<string>();

        /// <summary>
        /// An wen die Aufzeichnung gerade verliehen ist.
        /// </summary>
        public string Rent { get; set; }

        /// <summary>
        /// Die Art und der Standardort der Aufzeichnung.
        /// </summary>
        public Media Location { get; set; }

        /// <summary>
        /// Wann die Aufzeichnung angelegt wurde.
        /// </summary>
        public DateTime Added { get; set; }

        /// <summary>
        /// Optional eine Referenz auf die zugehörige Serie.
        /// </summary>
        public MovieDB.SeriesReference Series { get; set; }

        /// <summary>
        /// Eine freie Beschreibung zur Aufzeichnung.
        /// </summary>
        public string Description { get; set; }
    }
}
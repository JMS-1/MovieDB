using System;
using System.Xml.Serialization;


namespace MovieDB
{
    /// <summary>
    /// Instanzen dieser Klassen werden als Referenzen zu Serien verwendet, denen
    /// Aufzeichnungen zugeordnet werden können.
    /// </summary>
    [
        Serializable,
        XmlType( "Series" )
    ]
    public class SeriesReference
    {
        /// <summary>
        /// Liest oder setzt den Kurznamen der Serie - ohne die Namen der übergeordneten Serien.
        /// </summary>
        public string Name { get; set; }

        /// <summary>
        /// Liest oder setzt die Referenz auf die übergeordnete Serie.
        /// </summary>
        public SeriesReference Parent { get; set; }
    }

    /// <summary>
    /// Beschreibt zusätzliche Informationen zu einer Serie.
    /// </summary>
    [
        Serializable,
        XmlType( "SeriesInfo" )
    ]
    public class Series
    {
        /// <summary>
        /// Liest oder setzt den vollen Namen der Serie.
        /// </summary>
        public string Name { get; set; }

        /// <summary>
        /// Liest oder setzt die Beschreibung der Serie.
        /// </summary>
        public string Description { get; set; }
    }
}
using System;
using System.Collections.Generic;
using System.IO;
using System.Runtime.Serialization.Formatters.Binary;
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
    public class Recording : ICloneable
    {
        /// <summary>
        /// Jede Aufzeichnung erhält zur Laufzeit eine eindeutige Kennung.
        /// </summary>
        [XmlIgnore]
        public Guid UniqueId { get; set; }

        /// <summary>
        /// Der Name der Aufzeichnung.
        /// </summary>
        public string Title { get; set; }

        /// <summary>
        /// Die Sprachen, in der die Aufzeichnung vorliegt.
        /// </summary>
        [XmlArrayItem( "Language" )]
        public List<string> Languages { get; set; }

        /// <summary>
        /// Eine Liste von Kategorien für die Aufzeichnung.
        /// </summary>
        [XmlArrayItem( "Genre" )]
        public List<string> Genres { get; set; }

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
        /// Eine Liste freier Verweise für die Aufzeichnung.
        /// </summary>
        public Link[] Links { get; set; }

        /// <summary>
        /// Optional eine Referenz auf die zugehörige Serie.
        /// </summary>
        public MovieDB.SeriesReference Series { get; set; }

        /// <summary>
        /// Eine freie Beschreibung zur Aufzeichnung.
        /// </summary>
        public string Description { get; set; }

        /// <summary>
        /// Berechnet einen vollen Namen zu einer Aufzeichnung, in dem auch die
        /// zugeordnete Serie berücksichtigt wird.
        /// </summary>
        [XmlIgnore]
        public string FullTitle
        {
            get
            {
                // Get the name of the parent
                string series = (null == Series) ? null : Series.FullName;

                // Merge
                if (!string.IsNullOrEmpty( series ))
                    return string.Format( SeriesReference.SeriesLevelJoinFormat, series, Title );
                else
                    return Title;
            }
        }

        /// <summary>
        /// Erzeugt die Daten einer Aufzeichnung.
        /// </summary>
        public Recording()
        {
            // Load
            Languages = new List<string>();
            Genres = new List<string>();

            // Mark
            UniqueId = Guid.NewGuid();
        }

        /// <summary>
        /// Erzeugt eine exakte Kopie dieser Aufzeichnung.
        /// </summary>
        /// <returns>Die gewünschte Kopie.</returns>
        public Recording Clone()
        {
            // Create stream
            using (MemoryStream stream = new MemoryStream())
            {
                // Create serializer
                BinaryFormatter serializer = new BinaryFormatter();

                // Store self
                serializer.Serialize( stream, this );

                // Reset
                stream.Seek( 0, SeekOrigin.Begin );

                // Reconstruct
                return (Recording) serializer.Deserialize( stream );
            }
        }

        #region ICloneable Members

        /// <summary>
        /// Erzeugt eine exakte Kopie dieser Aufzeichnung.
        /// </summary>
        /// <returns>Die gewünschte Kopie.</returns>
        object ICloneable.Clone()
        {
            // Forward
            return Clone();
        }

        #endregion
    }
}
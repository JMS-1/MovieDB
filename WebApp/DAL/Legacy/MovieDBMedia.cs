using System;
using System.Xml.Serialization;


namespace MovieDB
{
    /// <summary>
    /// Beschreibt den Standort für eine Aufzeichnung.
    /// </summary>
    [
        Serializable,
        XmlType( "Media" )
    ]
    public class Media
    {
        /// <summary>
        /// Das für die Aufzeichnung verwendete Medium.
        /// </summary>
        public MediaTypes Type { get; set; }

        /// <summary>
        /// Der Standardort der Aufzeichnung (alte Notation).
        /// </summary>
        public string Location { get; set; }

        /// <summary>
        /// Der Standardort der Aufzeichnung.
        /// </summary>
        public ContainerReference Container { get; set; }

        /// <summary>
        /// Erzeugt eine neue Beschreibung.
        /// </summary>
        public Media()
        {
            // Setup
            Type = MediaTypes.Unknown;
        }
    }
}
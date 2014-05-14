using System;
using System.Xml.Serialization;


namespace MovieDB
{
    /// <summary>
    /// Die einzelnen Arten der Aufbewahrung.
    /// </summary>
    public enum ContainerType
    {
        /// <summary>
        /// Unbekannt oder nicht nicht erfasst.
        /// </summary>
        Unknown,

        /// <summary>
        /// Eine kleine DVD Box mit zusammengehörenden Aufzeichnungen.
        /// </summary>
        FeatureSet,

        /// <summary>
        /// Eine DVD Box mit vielen Aufzeichnungen, die ihnaltlich nicht zwingend einen Bezug haben.
        /// </summary>
        DVDBox,

        /// <summary>
        /// Ein Regalfach
        /// </summary>
        Shelf
    }

    /// <summary>
    /// Referenziert eine Aufbewahrungseinheit.
    /// </summary>
    [
        Serializable,
        XmlType( "ContainerReference" )
    ]
    public class ContainerReference
    {
        /// <summary>
        /// Der Name der Aufbewahrungseinheit, auf die Bezug genommen wird.
        /// </summary>
        public string Name { get; set; }

        /// <summary>
        /// Eine Bezugsnummer, die eine Aufzeichnung innerhalb einer Aufbewahrungseinheit 
        /// lokalisiert.
        /// </summary>
        public string UnitIdentifier { get; set; }

        /// <summary>
        /// Erzeugt eine neue Referenz.
        /// </summary>
        public ContainerReference()
        {
        }
    }

    /// <summary>
    /// Beschreibt eine Aufbewahrungseinheit für Medien.
    /// </summary>
    [
        Serializable,
        XmlType( "Container" )
    ]
    public class Container
    {
        /// <summary>
        /// Der eindeutige Name dieser Einheit.
        /// </summary>
        public string Name { get; set; }

        /// <summary>
        /// Die Art der Aufbewahtungseinheit.
        /// </summary>
        public ContainerType Type { get; set; }

        /// <summary>
        /// Optional eine übergeordnete Aufbewahrungseinheit.
        /// </summary>
        public ContainerReference Parent { get; set; }

        /// <summary>
        /// Eine Kurzbeschreibung des Standorts der Aufbewahrungseinheit.
        /// </summary>
        public string Location { get; set; }

        /// <summary>
        /// Erzeugt eine neue Beschreibung.
        /// </summary>
        public Container()
        {
            // Set up
            Type = ContainerType.Unknown;
        }
    }
}
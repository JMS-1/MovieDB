using System.Runtime.Serialization;


namespace WebApp.Models
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
    }
}
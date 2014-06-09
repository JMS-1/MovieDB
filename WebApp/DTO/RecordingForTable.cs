using System;
using System.Globalization;
using System.Runtime.Serialization;


namespace WebApp.DTO
{
    /// <summary>
    /// Beschreibt eine Aufzeichnung für die Ansicht in einer Tabelle.
    /// </summary>
    [DataContract]
    public class RecordingForTable : Recording
    {
        /// <summary>
        /// Der Zeitpunkt in GMT / UTC Notation zu dem die Aufzeichnung angelegt wurde.
        /// </summary>
        public DateTime CreationTime { get; set; }

        /// <summary>
        /// Der Zeitpunkt in GMT / UTC Notation zu dem die Aufzeichnung angelegt wurde.
        /// </summary>
        [DataMember( Name = "createdAsString" )]
        public string CreationTimeAsIsoString
        {
            get { return CreationTime.ToString( "o" ); }
            set { CreationTime = DateTime.Parse( value, CultureInfo.InvariantCulture, DateTimeStyles.RoundtripKind ); }
        }

        /// <summary>
        /// Erstellt eine neue Beschreibung.
        /// </summary>
        /// <param name="recording">Die Repräsentation aus der Datenbank.</param>
        private RecordingForTable( Models.Recording recording )
            : base( recording )
        {
        }

        /// <summary>
        /// Erstellt eine neue Ansicht.
        /// </summary>
        /// <param name="recording">Die Entität aus der Datenbank.</param>
        /// <returns>Die gewünschte Repräsentation.</returns>
        public static RecordingForTable Create( Models.Recording recording )
        {
            return new RecordingForTable( recording )
            {
                CreationTime = recording.CreationTime,
            };
        }
    }
}
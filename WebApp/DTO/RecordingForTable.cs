using System;
using System.Globalization;
using System.Linq;
using System.Runtime.Serialization;


namespace WebApp.DTO
{
    /// <summary>
    /// Beschreibt eine Aufzeichnung für die Ansicht in einer Tabelle.
    /// </summary>
    [DataContract]
    public class RecordingForTable
    {
        /// <summary>
        /// Die eindeutige Kennung der Aufzeichnung.
        /// </summary>
        [DataMember( Name = "id" )]
        public Guid RecordingIdentifier { get; set; }

        /// <summary>
        /// Der Name der Aufzeichnung.
        /// </summary>
        [DataMember( Name = "title" )]
        public string Name { get; set; }

        /// <summary>
        /// Der Ausleiher der Aufzeichnung.
        /// </summary>
        [DataMember( Name = "rent" )]
        public string RentTo { get; set; }

        /// <summary>
        /// Die Sprachen aller Tonspuren.
        /// </summary>
        [DataMember( Name = "languages" )]
        public string[] Languages { get; set; }

        /// <summary>
        /// Die Arten der Aufzeichnung.
        /// </summary>
        [DataMember( Name = "genres" )]
        public string[] Genres { get; set; }

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
        /// Die eindeutige Kennung der Serie.
        /// </summary>
        [DataMember( Name = "series" )]
        public Guid? Series { get; set; }

        /// <summary>
        /// Erstellt eine neue Ansicht.
        /// </summary>
        /// <param name="recording">Die Entität aus der Datenbank.</param>
        /// <returns>Die gewünschte Repräsentation.</returns>
        public static RecordingForTable Create( Models.Recording recording )
        {
            return new RecordingForTable
            {
                Languages = recording.Languages.Select( l => l.Description ).OrderBy( s => s ).ToArray(),
                Genres = recording.Genres.Select( l => l.Description ).OrderBy( s => s ).ToArray(),
                RecordingIdentifier = recording.Identifier,
                CreationTime = recording.CreationTime,
                Series = recording.SeriesIdentifier,
                RentTo = recording.RentTo,
                Name = recording.Title,
            };
        }
    }
}
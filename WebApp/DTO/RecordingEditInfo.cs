using System.Runtime.Serialization;


namespace WebApp.DTO
{
    /// <summary>
    /// Beschreibt eine Aufzeichnung für die Pflege.
    /// </summary>
    [DataContract]
    public class RecordingEditInfo : Recording
    {
        /// <summary>
        /// Die Beschreibung der Aufzeichnung.
        /// </summary>
        [DataMember( Name = "description" )]
        public string Description { get; set; }

        /// <summary>
        /// Erstellt eine neue Beschreibung.
        /// </summary>
        /// <param name="recording">Die Repräsentation aus der Datenbank.</param>
        private RecordingEditInfo( Models.Recording recording )
            : base( recording )
        {
        }

        /// <summary>
        /// Erstellt eine neue Beschreibung.
        /// </summary>
        public RecordingEditInfo()
        {
        }

        /// <summary>
        /// Erstellt eine neue Ansicht.
        /// </summary>
        /// <param name="recording">Die Entität aus der Datenbank.</param>
        /// <returns>Die gewünschte Repräsentation.</returns>
        public static RecordingEditInfo Create( Models.Recording recording )
        {
            return new RecordingEditInfo( recording )
            {
                Description = recording.Description,
            };
        }
    }
}
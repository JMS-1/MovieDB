using System.Runtime.Serialization;


namespace WebApp.DTO
{
    /// <summary>
    /// Beschreibt eine Aufzeichnung für die Pflege.
    /// </summary>
    [DataContract]
    public class RecordingForEdit : Recording
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
        private RecordingForEdit( Models.Recording recording )
            : base( recording )
        {
        }

        /// <summary>
        /// Erstellt eine neue Beschreibung.
        /// </summary>
        public RecordingForEdit()
        {
        }

        /// <summary>
        /// Erstellt eine neue Ansicht.
        /// </summary>
        /// <param name="recording">Die Entität aus der Datenbank.</param>
        /// <returns>Die gewünschte Repräsentation.</returns>
        public static RecordingForEdit Create( Models.Recording recording )
        {
            return new RecordingForEdit( recording )
            {
                Description = recording.Description,
            };
        }
    }
}
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
        /// Die Art des Mediums.
        /// </summary>
        [DataMember( Name = "mediaType" )]
        public Models.StoreType StoreType { get; set; }

        /// <summary>
        /// Der Name der Ablage.
        /// </summary>
        [DataMember( Name = "container" )]
        public string ContainerName { get; set; }

        /// <summary>
        /// Die Position in der Ablage.
        /// </summary>
        [DataMember( Name = "location" )]
        public string Location { get; set; }

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
                ContainerName = recording.Store.ContainerName,
                Location = recording.Store.Location,
                Description = recording.Description,
                StoreType = recording.Store.Type,
            };
        }
    }
}
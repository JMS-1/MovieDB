using System;
using System.Linq;
using System.Runtime.Serialization;


namespace WebApp.DTO
{
    /// <summary>
    /// Beschreibt eine Aufzeichnung für die Pflege.
    /// </summary>
    [DataContract]
    public class RecordingEditCore : Recording
    {
        /// <summary>
        /// Alle Verweise zur Aufzeichnung.
        /// </summary>
        [DataContract]
        public class Link
        {
            /// <summary>
            /// Der Name des Verweises.
            /// </summary>
            [DataMember( Name = "name" )]
            public string Name { get; set; }

            /// <summary>
            /// Der Verweis.
            /// </summary>
            [DataMember( Name = "url" )]
            public string Url { get; set; }

            /// <summary>
            /// Die Beschreibung des Verweises.
            /// </summary>
            [DataMember( Name = "description" )]
            public string Description { get; set; }
        }

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
        public Guid? Container { get; set; }

        /// <summary>
        /// Die Position in der Ablage.
        /// </summary>
        [DataMember( Name = "location" )]
        public string Location { get; set; }

        /// <summary>
        /// 
        /// </summary>
        [DataMember( Name = "links" )]
        public Link[] Links { get; set; }

        /// <summary>
        /// Erstellt eine neue Beschreibung.
        /// </summary>
        /// <param name="recording">Die Repräsentation aus der Datenbank.</param>
        protected RecordingEditCore( Models.Recording recording )
            : base( recording )
        {
            Container = recording.Store.ContainerIdentifier;
            Location = recording.Store.Location;
            Description = recording.Description;
            StoreType = recording.Store.Type;

            // Created ordered array of links
            Links =
                recording
                    .Links
                    .ToArray()
                    .OrderBy( l => l.Index )
                    .Select( l => new Link { Name = l.Name, Description = l.Description, Url = l.Url } )
                    .ToArray();
        }

        /// <summary>
        /// Erstellt eine neue Beschreibung.
        /// </summary>
        public RecordingEditCore()
        {
        }
    }

    /// <summary>
    /// Beschreibt eine Aufzeichnung für die Pflege.
    /// </summary>
    [DataContract]
    public class RecordingEditInfo : RecordingEditCore
    {
        /// <summary>
        /// Die eindeutige Kennung der Aufzeichnung.
        /// </summary>
        [DataMember( Name = "id" )]
        public Guid RecordingIdentifier { get; set; }

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
                RecordingIdentifier = recording.UniqueIdentifier,
            };
        }
    }
}
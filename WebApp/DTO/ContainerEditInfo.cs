using System;
using System.Collections.Generic;
using System.Linq;
using System.Runtime.Serialization;


namespace WebApp.DTO
{
    /// <summary>
    /// Beschreibt eine Aufbewahrung.
    /// </summary>
    [DataContract]
    public class ContainerEditInfo
    {
        /// <summary>
        /// Die Aufzeichnungen in dieser Aufbewahrung.
        /// </summary>
        [DataContract]
        public class Recording
        {
            /// <summary>
            /// Der volle Name der 
            /// </summary>
            [DataMember( Name = "name" )]
            public string FullName { get; set; }

            /// <summary>
            /// Die Position der Aufzeichnung innerhalb der Aufbewahrung.
            /// </summary>
            [DataMember( Name = "position" )]
            public string Position { get; set; }
        }

        /// <summary>
        /// Die eindeutige Kennung der Aufbewahrung.
        /// </summary>
        [DataMember( Name = "id" )]
        public Guid Identifier { get; set; }

        /// <summary>
        /// Der eindeutige Name der Aufbewahrung.
        /// </summary>
        [DataMember( Name = "name" )]
        public string Name { get; set; }

        /// <summary>
        /// Die optionale Beschreibung des Standortes.
        /// </summary>
        [DataMember( Name = "description" )]
        public string Description { get; set; }

        /// <summary>
        /// Die Art der Aufbewahrung.
        /// </summary>
        [DataMember( Name = "type" )]
        public Models.ContainerType ContainerType { get; set; }

        /// <summary>
        /// Die übergeordnete Aufbewahrung.
        /// </summary>
        [DataMember( Name = "parent" )]
        public Guid? ParentContainer { get; set; }

        /// <summary>
        /// Die relative Position innerhalb der übergeordneten Aufbewahrung.
        /// </summary>
        [DataMember( Name = "location" )]
        public string ParentLocation { get; set; }

        /// <summary>
        /// Die Namen der untergeordneten Aufbewahrungen.
        /// </summary>
        [DataMember( Name = "children" )]
        public string[] ChildContainerNames { get; set; }

        /// <summary>
        /// Alle Aufzeichnungen, die in dieser Aufbewahrung abgelegt sind.
        /// </summary>
        [DataMember( Name = "recordings" )]
        public Recording[] Recordings { get; set; }

        /// <summary>
        /// Erstellt die Beschreibung einer Aufbewahrung.
        /// </summary>
        /// <param name="container">Die in der Datenbank abgelegten Daten.</param>
        /// <param name="children">Alle untergeordneten Aufbewahrungen.</param>
        /// <param name="recordings">Alle hier abgelegten Aufzeichnungen.</param>
        /// <returns>Die gewünschte Beschreibung der Aufbewahrung.</returns>
        public static ContainerEditInfo Create( Models.Container container, IEnumerable<Models.Container> children, IEnumerable<Models.Recording> recordings )
        {
            return
                new ContainerEditInfo
                {
                    Recordings = recordings.Select( r => new Recording { FullName = r.FullName, Position = r.Store.Location } ).ToArray(),
                    ChildContainerNames = children.Select( c => c.Name ).ToArray(),
                    ParentContainer = container.ParentIdentifier,
                    Identifier = container.UniqueIdentifier,
                    ParentLocation = container.Location,
                    Description = container.Description,
                    ContainerType = container.Type,
                    Name = container.Name,
                };
        }
    }
}
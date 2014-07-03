using System;
using System.Runtime.Serialization;


namespace WebApp.DTO
{
    /// <summary>
    /// Die Daten zum Ändern einer Aufbewahrung.
    /// </summary>
    [DataContract]
    public class ContainerEdit
    {
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
    }
}
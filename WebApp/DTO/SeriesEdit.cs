using System;
using System.Runtime.Serialization;


namespace WebApp.DTO
{
    /// <summary>
    /// Beschreibt die neuen Daten einer Serie.
    /// </summary>
    [DataContract]
    public class SeriesEdit
    {

        /// <summary>
        /// Die eindeutige Kennung der übergeordneten Serie.
        /// </summary>
        [DataMember( Name = "parentId" )]
        public Guid? ParentIdentifier { get; set; }

        /// <summary>
        /// Der Eigenname der Serie.
        /// </summary>
        [DataMember( Name = "name" )]
        public string Name { get; set; }

        /// <summary>
        /// Die Beschreibung zur Serie.
        /// </summary>
        [DataMember( Name = "description" )]
        public string Description { get; set; }
    }
}
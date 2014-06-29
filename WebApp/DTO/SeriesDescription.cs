using System;
using System.Runtime.Serialization;


namespace WebApp.DTO
{
    /// <summary>
    /// Beschreibt eine Serie.
    /// </summary>
    [DataContract]
    public class SeriesDescription
    {
        /// <summary>
        /// Die eindeutige Kennung der Serie.
        /// </summary>
        [DataMember( Name = "id" )]
        public Guid UniqueIdentifier { get; set; }

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
        /// Der volle Name der Serie.
        /// </summary>
        [DataMember( Name = "hierarchicalName" )]
        public string FullName { get; set; }

        /// <summary>
        /// Erstellt eine neue Beschreibung.
        /// </summary>
        /// <param name="series">Die Entität aus der Datenbank.</param>
        /// <param name="getFullName">Ermittelt den vollständigen (hierarchichen) Namen einer Serie.</param>
        /// <returns>Die gewünschte Beschreibung.</returns>
        public static SeriesDescription Create( Models.Series series, Func<Guid, string> getFullName )
        {
            return
                new SeriesDescription
                {
                    FullName = getFullName( series.UniqueIdentifier ),
                    ParentIdentifier = series.ParentIdentifier,
                    UniqueIdentifier = series.UniqueIdentifier,
                    Name = series.Name,
                };
        }
    }
}
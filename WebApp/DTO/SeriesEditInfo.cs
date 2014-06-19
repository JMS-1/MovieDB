using System;
using System.Collections.Generic;
using System.Linq;
using System.Runtime.Serialization;


namespace WebApp.DTO
{
    /// <summary>
    /// Beschreibt eine Serie.
    /// </summary>
    [DataContract]
    public class SeriesEditInfo
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
        /// Die Beschreibung zur Serie.
        /// </summary>
        [DataMember( Name = "description" )]
        public string Description { get; set; }

        /// <summary>
        /// Gesetzt, wenn die Art gelöscht werden darf.
        /// </summary>
        [DataMember( Name = "unused" )]
        public bool CanBeDeleted { get; set; }

        /// <summary>
        /// Erstellt eine neue Beschreibung.
        /// </summary>
        /// <param name="series">Die Entität aus der Datenbank.</param>
        /// <param name="numberOfRecordings">Die Anzahl der Aufzeichnungen zu dieser Serie.</param>
        /// <param name="numberOfChildren">Die Anzahl der direkten Kindserien.</param>
        /// <returns>Die gewünschte Beschreibung.</returns>
        public static SeriesEditInfo Create( Models.Series series, int numberOfRecordings, int numberOfChildren )
        {
            return
                new SeriesEditInfo
                {
                    CanBeDeleted = (numberOfRecordings < 1) && (numberOfChildren < 1),
                    ParentIdentifier = series.ParentIdentifier,
                    UniqueIdentifier = series.UniqueIdentifier,
                    Description = series.Description,
                    Name = series.Name,
                };
        }
    }
}
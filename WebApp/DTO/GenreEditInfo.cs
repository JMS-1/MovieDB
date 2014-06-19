using System;
using System.Runtime.Serialization;


namespace WebApp.DTO
{
    /// <summary>
    /// Liefert die zum Ändern einer Art notwendigen Informationen.
    /// </summary>
    [DataContract]
    public class GenreEditInfo
    {
        /// <summary>
        /// Der eindeutige Name der Art.
        /// </summary>
        [DataMember( Name = "id" )]
        public Guid Identifier { get; set; }

        /// <summary>
        /// Der Anzeigename der Art.
        /// </summary>
        [DataMember( Name = "name" )]
        public string DisplayName { get; set; }

        /// <summary>
        /// Gesetzt, wenn die Art gelöscht werden darf.
        /// </summary>
        [DataMember( Name = "unused" )]
        public bool CanBeDeleted { get; set; }

        /// <summary>
        /// Erstellt eine neue Art.
        /// </summary>
        /// <param name="genre">Die konkreten Daten zur Art.</param>
        /// <param name="numberOfRecordings">Die Anzahl der Aufzeichnungen zu dieser Art.</param>
        /// <returns>Die gewünschten Informationen.</returns>
        public static GenreEditInfo Create( Models.Genre genre, int numberOfRecordings )
        {
            return
                new GenreEditInfo
                {
                    CanBeDeleted = numberOfRecordings < 1,
                    Identifier = genre.UniqueIdentifier,
                    DisplayName = genre.Description,
                };
        }
    }
}
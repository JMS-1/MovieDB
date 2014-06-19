using System;
using System.Runtime.Serialization;


namespace WebApp.DTO
{
    /// <summary>
    /// Beschreibt die Art einer Aufzeichnung.
    /// </summary>
    [DataContract]
    public class GenreDescription
    {
        /// <summary>
        /// Der eindeutige Kurzname der Art.
        /// </summary>
        [DataMember( Name = "id" )]
        public Guid Identifier { get; set; }

        /// <summary>
        /// Die eindeutige Beschreibung der Art.
        /// </summary>
        [DataMember( Name = "name" )]
        public string Name { get; set; }

        /// <summary>
        /// Erstellt eine neue Beschreibung.
        /// </summary>
        /// <param name="genre">Die Entität aus der Datenbank.</param>
        /// <returns>Die gewünschte Beschreibung.</returns>
        public static GenreDescription Create( Models.Genre genre )
        {
            return
                new GenreDescription
                {
                    Identifier = genre.UniqueIdentifier,
                    Name = genre.Name,
                };
        }
    }
}
using System;
using System.Runtime.Serialization;


namespace WebApp.DTO
{
    /// <summary>
    /// Beschreibt eine Sprache.
    /// </summary>
    [DataContract]
    public class LanguageDescription
    {
        /// <summary>
        /// Der eindeutige Kurzname der Sprache.
        /// </summary>
        [DataMember( Name = "id" )]
        public Guid Identifier { get; set; }

        /// <summary>
        /// Die eindeutige Beschreibung der Sprache.
        /// </summary>
        [DataMember( Name = "description" )]
        public string Description { get; set; }

        /// <summary>
        /// Erstellt eine neue Beschreibung.
        /// </summary>
        /// <param name="language">Die Entität aus der Datenbank.</param>
        /// <returns>Die gewünschte Beschreibung.</returns>
        public static LanguageDescription Create( Models.Language language )
        {
            return
                new LanguageDescription
                {
                    Identifier = language.UniqueIdentifier,
                    Description = language.Name,
                };
        }
    }
}
using System;
using System.Runtime.Serialization;


namespace WebApp.DTO
{
    /// <summary>
    /// Liefert die zum Ändern einer Sprache notwendigen Informationen.
    /// </summary>
    [DataContract]
    public class LanguageEditInfo
    {
        /// <summary>
        /// Das eindeutige Kürzel der Sprache.
        /// </summary>
        [DataMember( Name = "id" )]
        public Guid Identifier { get; set; }

        /// <summary>
        /// Der Anzeigename der Sprache.
        /// </summary>
        [DataMember( Name = "name" )]
        public string DisplayName { get; set; }

        /// <summary>
        /// Gesetzt, wenn die Sprache gelöscht werden darf.
        /// </summary>
        [DataMember( Name = "unused" )]
        public bool CanBeDeleted { get; set; }

        /// <summary>
        /// Erstellt eine neue Sprache.
        /// </summary>
        /// <param name="language">Die konkreten Daten zur Sprache.</param>
        /// <param name="numberOfRecordings">Die Anzahl der Aufzeichnungen zu dieser Sprache.</param>
        /// <returns>Die gewünschten Informationen.</returns>
        public static LanguageEditInfo Create( Models.Language language, int numberOfRecordings )
        {
            return
                new LanguageEditInfo
                {
                    Identifier = language.UniqueIdentifier,
                    CanBeDeleted = numberOfRecordings < 1,
                    DisplayName = language.Name,
                };
        }
    }
}
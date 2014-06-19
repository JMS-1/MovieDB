using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Data.Entity;


namespace WebApp.Models
{
    /// <summary>
    /// Die Sprache einer Tonspur.
    /// </summary>
    [Table( "Languages" )]
    public class Language
    {
        /// <summary>
        /// Die eindeutige Kennung der Sprache
        /// </summary>
        [Required, Key]
        [Column( "Id" )]
        public Guid UniqueIdentifier { get; set; }

        /// <summary>
        /// Der Langname der Sprache.
        /// </summary>
        [Required, StringLength( 100 )]
        [Column( "Long" )]
        public string Name { get; set; }

        /// <summary>
        /// Wird beim Anlegen des Datenbankmodells aufgerufen.
        /// </summary>
        /// <param name="modelBuilder">Die Feinsteuerung der Modellerzeugung.</param>
        internal static void BuildModel( DbModelBuilder modelBuilder )
        {
        }

        /// <summary>
        /// Erstellt eine neue Sprache.
        /// </summary>
        public Language()
        {
            UniqueIdentifier = Guid.NewGuid();
        }
    }
}
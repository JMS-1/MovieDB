using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Data.Entity;


namespace WebApp.Models
{
    /// <summary>
    /// Eine Kategorie von Aufnahme.
    /// </summary>
    [Table( "Genres" )]
    public class Genre
    {
        /// <summary>
        /// Die eindeutige Kennung der Kategorie.
        /// </summary>
        [Required, Key]
        [Column( "Id" )]
        public Guid UniqueIdentifier { get; set; }

        /// <summary>
        /// Der Beschreibung der Kategorie.
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
        /// Erstellt eine neue Kategorie.
        /// </summary>
        public Genre()
        {
            UniqueIdentifier = Guid.NewGuid();
        }
    }
}
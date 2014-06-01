using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Data.Entity;


namespace WebApp.Models
{
    /// <summary>
    /// Eine Art von Aufnahme.
    /// </summary>
    [Table( "Genres" )]
    public class Genre
    {
        /// <summary>
        /// Der Name der Art.
        /// </summary>
        [Required, Key, StringLength( 20 )]
        [Column( "Short" )]
        public string Name { get; set; }

        /// <summary>
        /// Der Beschreibung der Art.
        /// </summary>
        [Required, StringLength( 100 )]
        [Column( "Long" )]
        public string Description { get; set; }

        /// <summary>
        /// Wird beim Anlegen des Datenbankmodells aufgerufen.
        /// </summary>
        /// <param name="modelBuilder">Die Feinsteuerung der Modellerzeugung.</param>
        internal static void BuildModel( DbModelBuilder modelBuilder )
        {
        }
    }
}
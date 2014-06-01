using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Data.Entity;
using System.Runtime.Serialization;


namespace WebApp.Models
{
    /// <summary>
    /// Eine Art von Aufnahme.
    /// </summary>
    [DataContract]
    [Table( "Genres" )]
    public class Genre
    {
        /// <summary>
        /// Der Name der Art.
        /// </summary>
        [Required, Key, StringLength( 20, MinimumLength = 1 )]
        [DataMember( Name = "name" )]
        [Column( "Short" )]
        public string Name { get; set; }

        /// <summary>
        /// Der Beschreibung der Art.
        /// </summary>
        [Required, StringLength( 100, MinimumLength = 1 )]
        [DataMember( Name = "description" )]
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
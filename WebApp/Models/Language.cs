using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Data.Entity;
using System.Runtime.Serialization;


namespace WebApp.Models
{
    /// <summary>
    /// Die Sprache einer Tonspur.
    /// </summary>
    [DataContract]
    [Table( "Languages" )]
    public class Language
    {
        /// <summary>
        /// Der Kurzname der Sprache. 
        /// </summary>
        [Required, Key, StringLength( 2, MinimumLength = 2 )]
        [Column( "Short" )]
        [DataMember( Name = "language" )]
        public string TwoLetterIsoName { get; set; }

        /// <summary>
        /// Der Langname der Sprache.
        /// </summary>
        [Required, StringLength( 100, MinimumLength = 1 )]
        [Column( "Long" )]
        [DataMember( Name = "description" )]
        public string Description { get; set; }

        /// <summary>
        /// Wird beim Anlegen des Datenbankmodells aufgerufen.
        /// </summary>
        /// <param name="modelBuilder">Die Feinsteuerung der Modellerzeugung.</param>
        internal static void BuildModel( DbModelBuilder modelBuilder )
        {
            modelBuilder
                .Entity<Language>()
                .Property( e => e.TwoLetterIsoName )
                .IsFixedLength();
        }
    }
}
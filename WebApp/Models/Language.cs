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
        /// Der Kurzname der Sprache. 
        /// </summary>
        [Required, Key, StringLength( 2, MinimumLength = 2 ), RegularExpression( @"[a-z]{2}", ErrorMessage = "Das Sprachkürzel muss aus zwei Buchstaben bestehen" )]
        [Column( "Short" )]
        public string TwoLetterIsoName { get; set; }

        /// <summary>
        /// Der Langname der Sprache.
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
            modelBuilder
                .Entity<Language>()
                .Property( e => e.TwoLetterIsoName )
                .IsFixedLength();
        }
    }
}
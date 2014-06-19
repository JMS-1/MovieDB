using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Data.Entity;


namespace WebApp.Models
{
    /// <summary>
    /// Wird von allen Entitäten angeboten, die Verweise verwenden.
    /// </summary>
    public interface ILinkHolder
    {
        ICollection<Link> Links { get; }
    }

    /// <summary>
    /// Beschreibt einen Verweis auf eine Internetseite.
    /// </summary>
    [Table( "Links" )]
    public class Link
    {
        /// <summary>
        /// Die eindeutige Kennung einer Entität, zu der dieser Verweis gehört.
        /// </summary>
        [Required, Key]
        [Column( "For", Order = 0 )]
        public Guid UniqueIdentifier { get; set; }

        /// <summary>
        /// Der eigentliche Verweis.
        /// </summary>
        [Required, StringLength( 2000 ), Url]
        [Column( "Url" )]
        public string Url { get; set; }

        /// <summary>
        /// Der Name des Verweises.
        /// </summary>
        [Required, StringLength( 100 )]
        [Column( "Name" )]
        public string Name { get; set; }

        /// <summary>
        /// Optional eine Beschreibung des Verweises.
        /// </summary>
        [StringLength( 2000 )]
        [Column( "Description" )]
        public string Description { get; set; }

        /// <summary>
        /// Die laufende Nummer des Verweises relativ zur zugehörigen Entität.
        /// </summary>
        [Required, Key]
        [Column( "Ordinal", Order = 1 )]
        public int Index { get; set; }

        /// <summary>
        /// Wird beim Anlegen des Datenbankmodells aufgerufen.
        /// </summary>
        /// <param name="modelBuilder">Die Feinsteuerung der Modellerzeugung.</param>
        internal static void BuildModel( DbModelBuilder modelBuilder )
        {
        }
    }
}
using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Data.Entity;


namespace WebApp.Models
{
    /// <summary>
    /// Beschreibt ein einzelnes Medium, auf dem Aufzeichnungen physikalisch gespeichert sind.
    /// </summary>
    [Table( "Media" )]
    public class Store
    {
        /// <summary>
        /// Die eindeutige Kennung des Mediums.
        /// </summary>
        [Required, Key]
        [Column( "Id" )]
        public Guid Identifier { get; set; }

        /// <summary>
        /// Die Art des Mediums
        /// </summary>
        [Required]
        [Column( "Type", TypeName = "tinyint" )]
        public StoreType Type { get; set; }

        /// <summary>
        /// Der eindeutige Name der zugehörigen Aufbewahrung.
        /// </summary>
        [StringLength( 50 )]
        [Column( "Container" )]
        public string ContainerName { get; set; }

        /// <summary>
        /// Der Standord relativ zur Aufbewahrung.
        /// </summary>
        [StringLength( 100 )]
        [Column( "Position" )]
        public string Location { get; set; }

        /// <summary>
        /// Die zugehörige Aufbewahrung.
        /// </summary>
        public virtual Container Container { get; set; }

        /// <summary>
        /// Erstellt ein neues Medium.
        /// </summary>
        public Store()
        {
            Identifier = Guid.NewGuid();
        }

        /// <summary>
        /// Wird beim Anlegen des Datenbankmodells aufgerufen.
        /// </summary>
        /// <param name="modelBuilder">Die Feinsteuerung der Modellerzeugung.</param>
        internal static void BuildModel( DbModelBuilder modelBuilder )
        {
            modelBuilder
                .Entity<Store>()
                .HasOptional( s => s.Container )
                .WithMany()
                .HasForeignKey( s => s.ContainerName )
                .WillCascadeOnDelete( false );
        }
    }
}
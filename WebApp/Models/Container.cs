using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Data.Entity;


namespace WebApp.Models
{
    /// <summary>
    /// Ein einzelner Aufbewahrungsort.
    /// </summary>
    [Table( "Containers" )]
    public class Container
    {
        /// <summary>
        /// Die eindeutige Kennung der Aufbewahrung.
        /// </summary>
        [Required, Key]
        [Column( "Id" )]
        public Guid UniqueIdentifier { get; set; }

        /// <summary>
        /// Der eindeutige Name der Aufbewahrung.
        /// </summary>
        [Required, StringLength( 50, MinimumLength = 1 )]
        [Column( "Name" )]
        public string Name { get; set; }

        /// <summary>
        /// Die Art der Aufbewahrung.
        /// </summary>
        [Required]
        [Column( "Type", TypeName = "tinyint" )]
        public ContainerType Type { get; set; }

        /// <summary>
        /// Eine Kurzbeschreibung des Standorts der Aufbewahrungseinheit.
        /// </summary>
        [StringLength( 2000 )]
        [Column( "Description" )]
        public string Description { get; set; }

        /// <summary>
        /// Der eindeutige Name der übergeordneten Aufbewahrung.
        /// </summary>
        [Column( "Parent" )]
        public Guid? ParentIdentifier { get; set; }

        /// <summary>
        /// Der Standord relativ zur übergeordneten Aufbewahrung.
        /// </summary>
        [StringLength( 100 )]
        [Column( "ParentLocation" )]
        public string Location { get; set; }

        /// <summary>
        /// Die übergeordnete Aufbewahrung.
        /// </summary>
        public virtual Container ParentContainer { get; set; }

        /// <summary>
        /// Erzeugt eine neue Beschreibung.
        /// </summary>
        public Container()
        {
            UniqueIdentifier = Guid.NewGuid();
            Type = ContainerType.Undefined;
        }

        /// <summary>
        /// Wird beim Anlegen des Datenbankmodells aufgerufen.
        /// </summary>
        /// <param name="modelBuilder">Die Feinsteuerung der Modellerzeugung.</param>
        internal static void BuildModel( DbModelBuilder modelBuilder )
        {
            modelBuilder
                .Entity<Container>()
                .HasOptional( c => c.ParentContainer )
                .WithMany()
                .HasForeignKey( c => c.ParentIdentifier )
                .WillCascadeOnDelete( false );
        }
    }
}
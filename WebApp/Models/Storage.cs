using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Data.Entity;
using System.Runtime.Serialization;


namespace WebApp.Models
{
    /// <summary>
    /// Beschreibt ein einzelnes Medium, auf dem Aufzeichnungen physikalisch gespeichert sind.
    /// </summary>
    [DataContract]
    [Table( "Media" )]
    public class Storage
    {
        /// <summary>
        /// Die eindeutige Kennung des Mediums.
        /// </summary>
        [Required, Key]
        [DataMember( Name = "id" )]
        [Column( "Id" )]
        public Guid Identifier { get; set; }

        /// <summary>
        /// Die Art des Mediums
        /// </summary>
        [Required]
        [DataMember( Name = "type" )]
        [Column( "Type", TypeName = "tinyint" )]
        public MediaType Type { get; set; }

        /// <summary>
        /// Der eindeutige Name der zugehörigen Aufbewahrung.
        /// </summary>
        [StringLength( 50, MinimumLength = 1 )]
        [DataMember( Name = "containerName" )]
        [Column( "Container" )]
        public string ContainerName { get; set; }

        /// <summary>
        /// Der Standord relativ zur Aufbewahrung.
        /// </summary>
        [Required, StringLength( 100, MinimumLength = 1 )]
        [DataMember( Name = "containerLocation" )]
        [Column( "Position" )]
        public string Location { get; set; }

        /// <summary>
        /// Die zugehörige Aufbewahrung.
        /// </summary>
        public virtual Container Container { get; set; }

        /// <summary>
        /// Erstellt ein neues Medium.
        /// </summary>
        public Storage()
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
                .Entity<Storage>()
                .HasOptional( m => m.Container )
                .WithMany()
                .HasForeignKey( m => m.ContainerName );
        }
    }
}
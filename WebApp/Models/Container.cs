using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Data.Entity;
using System.Runtime.Serialization;


namespace WebApp.Models
{
    /// <summary>
    /// Ein einzelner Aufbewahrungsort.
    /// </summary>
    [DataContract]
    [Table( "Containers" )]
    public class Container
    {
        /// <summary>
        /// Der eindeutige Name der Aufbewahrung.
        /// </summary>
        [Required, Key, StringLength( 50, MinimumLength = 1 )]
        [DataMember( Name = "name" )]
        [Column( "Name" )]
        public string Name { get; set; }

        /// <summary>
        /// Eine Kurzbeschreibung des Standorts der Aufbewahrungseinheit.
        /// </summary>
        [StringLength( 2000 )]
        [DataMember( Name = "description" )]
        [Column( "Description" )]
        public string Description { get; set; }

        /// <summary>
        /// Die Art der Aufbewahrung.
        /// </summary>
        [Required]
        [DataMember( Name = "type" )]
        [Column( "Type", TypeName = "tinyint" )]
        public ContainerType Type { get; set; }

        /// <summary>
        /// Der eindeutige Name der übergeordneten Aufbewahrung.
        /// </summary>
        [StringLength( 50, MinimumLength = 1 )]
        [DataMember( Name = "parentName" )]
        [Column( "Parent" )]
        public string ParentName { get; set; }

        /// <summary>
        /// Der Standord relativ zur übergeordneten Aufbewahrung.
        /// </summary>
        [StringLength( 100, MinimumLength = 1 )]
        [DataMember( Name = "parentLocation" )]
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
            // Set up
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
                .HasForeignKey( c => c.ParentName );
        }
    }
}
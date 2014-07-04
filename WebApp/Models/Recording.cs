using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Data.Entity;


namespace WebApp.Models
{
    /// <summary>
    /// Eine Aufnahme.
    /// </summary>
    [Table( "Recordings" )]
    public class Recording : ILinkHolder
    {
        /// <summary>
        /// Die eindeutige Kennung der Aufnahme, über die diese permanent referenziert werden kann.
        /// </summary>
        [Required, Key]
        [Column( "Id" )]
        public Guid UniqueIdentifier { get; set; }

        /// <summary>
        /// Der Name der aufgezeichneten Sendung.
        /// </summary>
        [Required, StringLength( 200, MinimumLength = 1 )]
        [Column( "Name" )]
        public string Name { get; set; }

        /// <summary>
        /// Der volle Name der aufgezeichneten Sendung.
        /// </summary>
        [Column( "HierarchicalName" )]
        [DatabaseGenerated( DatabaseGeneratedOption.Computed )]
        public string FullName { get; set; }

        /// <summary>
        /// Der Name des Entleihers.
        /// </summary>
        [StringLength( 200 )]
        [Column( "RentTo" )]
        public string RentTo { get; set; }

        /// <summary>
        /// Der Zeitpunkt in GMT / UTC Notation zu dem die Aufzeichnung angelegt wurde.
        /// </summary>
        [Required]
        [Column( "Created" )]
        public DateTime CreationTimeInDatabase { get; set; }

        /// <summary>
        /// Der Zeitpunkt in GMT / UTC Notation zu dem die Aufzeichnung angelegt wurde.
        /// </summary>
        [NotMapped]
        public DateTime CreationTime
        {
            get { return new DateTime( CreationTimeInDatabase.Ticks, DateTimeKind.Utc ); }
            set
            {
                if (value.Kind == DateTimeKind.Local)
                    CreationTimeInDatabase = value.ToUniversalTime();
                else
                    CreationTimeInDatabase = value;
            }
        }

        /// <summary>
        /// Eine optionale Beschreibung zur aufgezeichneten Sendung.
        /// </summary>
        [StringLength( 2000 )]
        [Column( "Description" )]
        public string Description { get; set; }

        /// <summary>
        /// Die Kennung des zugehörigen physikalischen Mediums.
        /// </summary>
        [Required]
        [Column( "Media" )]
        public Guid StoreIdentifier { get; set; }

        /// <summary>
        /// Die Kennung der zugehörigen Serie.
        /// </summary>
        [Column( "Series" )]
        public Guid? SeriesIdentifier { get; set; }

        /// <summary>
        /// Die Liste der Sprachzuordnungen.
        /// </summary>
        public virtual ICollection<Language> Languages { get; set; }

        /// <summary>
        /// Die Liste der Arten.
        /// </summary>
        public virtual ICollection<Genre> Genres { get; set; }

        /// <summary>
        /// Das zugehörige Medium.
        /// </summary>
        public virtual Store Store { get; set; }

        /// <summary>
        /// Die zugehörige Serie.
        /// </summary>
        public virtual Series Series { get; set; }

        /// <summary>
        /// Alle Verweise.
        /// </summary>
        public virtual ICollection<Link> Links { get; set; }

        /// <summary>
        /// Wird beim Anlegen des Datenbankmodells aufgerufen.
        /// </summary>
        /// <param name="modelBuilder">Die Feinsteuerung der Modellerzeugung.</param>
        internal static void BuildModel( DbModelBuilder modelBuilder )
        {
            modelBuilder
                .Entity<Recording>()
                .HasMany( r => r.Languages )
                .WithMany()
                .Map( m =>
                {
                    m.ToTable( "RecordingLanguages" );
                    m.MapLeftKey( "Recording" );
                    m.MapRightKey( "Language" );
                } );

            modelBuilder
                .Entity<Recording>()
                .HasMany( r => r.Genres )
                .WithMany()
                .Map( m =>
                {
                    m.ToTable( "RecordingGenres" );
                    m.MapLeftKey( "Recording" );
                    m.MapRightKey( "Genre" );
                } );

            modelBuilder
                .Entity<Recording>()
                .HasRequired( r => r.Store )
                .WithMany()
                .HasForeignKey( r => r.StoreIdentifier )
                .WillCascadeOnDelete( false );

            modelBuilder
                .Entity<Recording>()
                .HasOptional( r => r.Series )
                .WithMany()
                .HasForeignKey( r => r.SeriesIdentifier )
                .WillCascadeOnDelete( false );

            modelBuilder
                .Entity<Recording>()
                .HasMany( r => r.Links )
                .WithRequired()
                .HasForeignKey( l => l.UniqueIdentifier )
                .WillCascadeOnDelete( true );
        }

        /// <summary>
        /// Legt eine neue Aufzeichnung an.
        /// </summary>
        public Recording()
        {
            UniqueIdentifier = Guid.NewGuid();
            Languages = new List<Language>();
            Genres = new List<Genre>();
            Links = new List<Link>();
        }
    }
}
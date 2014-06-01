using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Data.Entity;
using System.Globalization;
using System.Runtime.Serialization;


namespace WebApp.Models
{
    /// <summary>
    /// Eine Aufnahme.
    /// </summary>
    [DataContract]
    [Table( "Recordings" )]
    public class Recording
    {
        /// <summary>
        /// Die eindeutige Kennung der Aufnahme, über die diese permanent referenziert werden kann.
        /// </summary>
        [Required, Key]
        [DataMember( Name = "id" )]
        [Column( "Id" )]
        public Guid Id { get; set; }

        /// <summary>
        /// Der Name der aufgezeichneten Sendung.
        /// </summary>
        [Required, StringLength( 200, MinimumLength = 1 )]
        [DataMember( Name = "title" )]
        [Column( "Name" )]
        public string Title { get; set; }

        /// <summary>
        /// Eine optionale Beschreibung zur aufgezeichneten Sendung.
        /// </summary>
        [StringLength( 2000 )]
        [DataMember( Name = "description" )]
        [Column( "Description" )]
        public string Description { get; set; }

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
            set { CreationTimeInDatabase = value; }
        }

        /// <summary>
        /// Der Zeitpunkt in GMT / UTC Notation zu dem die Aufzeichnung angelegt wurde.
        /// </summary>
        [DataMember( Name = "created" )]
        [NotMapped]
        public string CreationTimeAsIsoString
        {
            get { return CreationTime.ToString( "o" ); }
            set { CreationTime = DateTime.Parse( value, CultureInfo.InvariantCulture, DateTimeStyles.RoundtripKind ); }
        }

        /// <summary>
        /// Die Liste der Sprachzuordnungen.
        /// </summary>
        [DataMember( Name = "languages" )]
        public ICollection<Language> Languages { get; set; }

        /// <summary>
        /// Die Liste der Arten.
        /// </summary>
        [DataMember( Name = "genres" )]
        public ICollection<Genre> Genres { get; set; }

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
        }

        /// <summary>
        /// Legt eine neue Aufzeichnung an.
        /// </summary>
        public Recording()
        {
            Languages = new List<Language>();
            Genres = new List<Genre>();
            Id = Guid.NewGuid();
        }
    }
}
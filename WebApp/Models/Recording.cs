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
        /// Wird beim Anlegen des Datenbankmodells aufgerufen.
        /// </summary>
        /// <param name="modelBuilder">Die Feinsteuerung der Modellerzeugung.</param>
        internal static void BuildModel( DbModelBuilder modelBuilder )
        {
        }

        /// <summary>
        /// Legt eine neue Aufzeichnung an.
        /// </summary>
        public Recording()
        {
            Id = Guid.NewGuid();
        }
    }

#if X
-- Recordings

	CREATE TABLE [dbo].[Recordings] (
		[RentTo]      NVARCHAR (200)   NULL,
		[Media]       UNIQUEIDENTIFIER NULL,
		[Series]      UNIQUEIDENTIFIER NULL,
		CONSTRAINT [FK_Recordings_Media] FOREIGN KEY ([Media]) REFERENCES [dbo].[Media] ([Id]) ON DELETE SET NULL,
		CONSTRAINT [FK_Recordings_Series] FOREIGN KEY ([Series]) REFERENCES [dbo].[Series] ([Id]) ON DELETE SET NULL
	);
	GO

	CREATE NONCLUSTERED INDEX [IX_Recordings_Series]
		ON [dbo].[Recordings]([Series]);
	GO

	CREATE TABLE [dbo].[RecordingGenres] (
		[Genre]     NVARCHAR (20)    NOT NULL,
		[Recording] UNIQUEIDENTIFIER NOT NULL,
		CONSTRAINT [FK_RecordingGenres_Genre] FOREIGN KEY ([Genre]) REFERENCES [dbo].[Genres] ([Short]) ON DELETE CASCADE,
		CONSTRAINT [FK_RecordingGenres_Recording] FOREIGN KEY ([Recording]) REFERENCES [dbo].[Recordings] ([Id]) ON DELETE CASCADE
	);
	GO

	CREATE NONCLUSTERED INDEX [IX_RecordingGenres_Genre]
		ON [dbo].[RecordingGenres]([Genre]);
	GO

	CREATE NONCLUSTERED INDEX [IX_RecordingGenres_Recording]
		ON [dbo].[RecordingGenres]([Recording]);
	GO

	CREATE TABLE [dbo].[RecordingLanguages] (
		[Language]  NCHAR (2)        NOT NULL,
		[Recording] UNIQUEIDENTIFIER NOT NULL,
		CONSTRAINT [FK_RecordingLanguages_Language] FOREIGN KEY ([Language]) REFERENCES [dbo].[Languages] ([Short]) ON DELETE CASCADE,
		CONSTRAINT [FK_RecordingLanguages_Recording] FOREIGN KEY ([Recording]) REFERENCES [dbo].[Recordings] ([Id]) ON DELETE CASCADE
	);
	GO

	CREATE NONCLUSTERED INDEX [IX_RecordingLanguages_Language]
		ON [dbo].[RecordingLanguages]([Language]);
	GO

	CREATE NONCLUSTERED INDEX [IX_RecordingLanguages_Recording]
		ON [dbo].[RecordingLanguages]([Recording]);
	GO
#endif
}
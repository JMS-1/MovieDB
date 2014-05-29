-- Container

	CREATE TABLE [dbo].[Containers] (
		[Name]        NVARCHAR (50)   NOT NULL,
		[Type]        TINYINT         NOT NULL,
		[Description] NVARCHAR (2000) NULL,
		PRIMARY KEY CLUSTERED ([Name])
	);
	GO

	CREATE NONCLUSTERED INDEX [PK__Containers]
		ON [dbo].[Containers]([Name]);
	GO

	CREATE TABLE [dbo].[ContainerHierarchy] (
		[Parent]   NVARCHAR (50)  NULL,
		[Child]    NVARCHAR (50)  NULL,
		[Location] NVARCHAR (100) NULL,
		CONSTRAINT [FK_ContainerHierarchy_Child] FOREIGN KEY ([Child]) REFERENCES [dbo].[Containers] ([Name]),
		CONSTRAINT [FK_ContainerHierarchy_Parent] FOREIGN KEY ([Parent]) REFERENCES [dbo].[Containers] ([Name])
	);
	GO

	CREATE NONCLUSTERED INDEX [IX_ContainerHierarchy_Parent]
		ON [dbo].[ContainerHierarchy]([Parent]);
	GO

	CREATE NONCLUSTERED INDEX [IX_ContainerHierarchy_Child]
		ON [dbo].[ContainerHierarchy]([Child]);
	GO

	CREATE TRIGGER [dbo].[Delete_Container]
		ON [dbo].[Containers]
		INSTEAD OF DELETE
		AS
		BEGIN
			SET NoCount ON
			DELETE FROM [ContainerHierarchy] WHERE Parent IN (SELECT Name FROM DELETED) OR Child IN (Select Name FROM DELETED)
			DELETE FROM [Containers] WHERE Name IN (SELECT Name FROM DELETED)
		END
	GO

-- Genre

	CREATE TABLE [dbo].[Genres] (
		[Short] NVARCHAR (20)  NOT NULL,
		[Long]  NVARCHAR (100) NOT NULL,
		PRIMARY KEY CLUSTERED ([Short])
	);
	GO

	CREATE UNIQUE NONCLUSTERED INDEX [PK_Genres]
		ON [dbo].[Genres]([Short]);
	GO

-- Language

	CREATE TABLE [dbo].[Languages] (
		[Short] NCHAR (2)      NOT NULL,
		[Long]  NVARCHAR (100) NOT NULL,
		PRIMARY KEY CLUSTERED ([Short])
	);
	GO

	CREATE UNIQUE NONCLUSTERED INDEX [PK_Languages]
		ON [dbo].[Languages]([Short]);
	GO

	CREATE UNIQUE NONCLUSTERED INDEX [IX_Languages_Long]
		ON [dbo].[Languages]([Long]);
	GO

-- Links

	CREATE TABLE [dbo].[Links] (
		[For]         UNIQUEIDENTIFIER NOT NULL,
		[Url]         NVARCHAR (2000)  NOT NULL,
		[Name]        NVARCHAR (100)   NOT NULL,
		[Description] NVARCHAR (2000)  NULL,
		[Ordinal]     INT              IDENTITY (1, 1) NOT NULL
	);
	GO

	CREATE NONCLUSTERED INDEX [IX_Links_For]
		ON [dbo].[Links]([For]);
	GO

	CREATE NONCLUSTERED INDEX [IX_Links_Ordinal]
		ON [dbo].[Links]([Ordinal]);
	GO

-- Media

	CREATE TABLE [dbo].[Media] (
		[Type]      TINYINT          NOT NULL,
		[Container] NVARCHAR (50)    NULL,
		[Position]  NVARCHAR (100)   NULL,
		[Id]        UNIQUEIDENTIFIER NOT NULL,
		PRIMARY KEY CLUSTERED ([Id]),
		CONSTRAINT [FK_Media_Container] FOREIGN KEY ([Container]) REFERENCES [dbo].[Containers] ([Name]) ON DELETE SET NULL
	);
	GO

	CREATE NONCLUSTERED INDEX [PK_Media]
		ON [dbo].[Media]([Id]);
	GO

-- Series

	CREATE TABLE [dbo].[Series] (
		[Id]          UNIQUEIDENTIFIER NOT NULL,
		[Name]        NVARCHAR (50)    NOT NULL,
		[Description] NVARCHAR (2000)  NULL,
		[Parent]      UNIQUEIDENTIFIER NULL,
		PRIMARY KEY CLUSTERED ([Id])
	);
	GO

	CREATE UNIQUE NONCLUSTERED INDEX [PK_Series]
		ON [dbo].[Series]([Id]);
	GO

	CREATE TRIGGER [dbo].[Delete_Series]
		ON [dbo].[Series]
		FOR DELETE
		AS
		BEGIN
			SET NoCount ON
			DELETE FROM [dbo].[Links] WHERE [For] IN (Select [Id] FROM DELETED)
			UPDATE [dbo].[Series] SET [Parent] = NULL WHERE [Parent] IN (Select [Id] FROM DELETED)
		END
	GO

-- Recordings

	CREATE TABLE [dbo].[Recordings] (
		[Id]          UNIQUEIDENTIFIER NOT NULL,
		[Name]        NVARCHAR (200)   NOT NULL,
		[RentTo]      NVARCHAR (200)   NULL,
		[Created]     DATETIME         NOT NULL,
		[Description] NVARCHAR (2000)  NULL,
		[Media]       UNIQUEIDENTIFIER NULL,
		[Series]      UNIQUEIDENTIFIER NULL,
		PRIMARY KEY CLUSTERED ([Id]),
		CONSTRAINT [FK_Recordings_Media] FOREIGN KEY ([Media]) REFERENCES [dbo].[Media] ([Id]) ON DELETE SET NULL,
		CONSTRAINT [FK_Recordings_Series] FOREIGN KEY ([Series]) REFERENCES [dbo].[Series] ([Id]) ON DELETE SET NULL
	);
	GO

	CREATE NONCLUSTERED INDEX [IX_Recordings_Created]
		ON [dbo].[Recordings]([Created]);
	GO

	CREATE NONCLUSTERED INDEX [IX_Recordings_Name]
		ON [dbo].[Recordings]([Name]);
	GO

	CREATE UNIQUE NONCLUSTERED INDEX [PK_Recordings]
		ON [dbo].[Recordings]([Id]);
	GO

	CREATE NONCLUSTERED INDEX [IX_Recordings_Series]
		ON [dbo].[Recordings]([Series]);
	GO

	CREATE TRIGGER [dbo].[Delete_Recordings]
		ON [dbo].[Recordings]
		FOR DELETE
		AS
		BEGIN
			SET NoCount ON
			DELETE FROM [dbo].[Links] WHERE [For] IN (Select [Id] FROM DELETED)
		END
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
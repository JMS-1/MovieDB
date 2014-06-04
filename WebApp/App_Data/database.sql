-- Container

	CREATE TABLE [dbo].[Containers] (
		[Name]				NVARCHAR (50)   NOT NULL,
		[Type]				TINYINT         NOT NULL,
		[Description]		NVARCHAR (2000) NULL,
		[Parent]			NVARCHAR (50)   NULL,
		[ParentLocation]	NVARCHAR (100)  NULL,
		PRIMARY KEY CLUSTERED ([Name]),
		CONSTRAINT [FK_Containers_Parent] FOREIGN KEY ([Parent]) REFERENCES [dbo].[Containers] ([Name])
	);
	GO

	CREATE TRIGGER [dbo].[Delete_Container]
		ON [dbo].[Containers]
		INSTEAD OF DELETE
		AS
		BEGIN
			SET NoCount ON
			UPDATE [Containers] SET [Parent] = NULL, [ParentLocation] = NULL WHERE [Parent] IN (SELECT Name FROM DELETED)
			DELETE FROM [Containers] WHERE [Name] IN (SELECT Name FROM DELETED)
		END
	GO

-- Genre

	CREATE TABLE [dbo].[Genres] (
		[Short] NVARCHAR (20)  NOT NULL,
		[Long]  NVARCHAR (100) NOT NULL,
		PRIMARY KEY CLUSTERED ([Short]),
		CONSTRAINT [U_Genres_Long] UNIQUE ([Long]) 
	);
	GO

-- Language

	CREATE TABLE [dbo].[Languages] (
		[Short] NCHAR (2)      NOT NULL,
		[Long]  NVARCHAR (100) NOT NULL,
		PRIMARY KEY CLUSTERED ([Short]),
		CONSTRAINT [U_Languages_Long] UNIQUE ([Long]) 
	);
	GO

-- Links

	CREATE TABLE [dbo].[Links] (
		[For]         UNIQUEIDENTIFIER NOT NULL,
		[Url]         NVARCHAR (2000)  NOT NULL,
		[Name]        NVARCHAR (100)   NOT NULL,
		[Description] NVARCHAR (2000)  NULL,
		[Ordinal]     INT              NOT NULL,
		CONSTRAINT [U_Links_ForOrdinal] UNIQUE ([For], [Ordinal])
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
		[Id]        UNIQUEIDENTIFIER NOT NULL,
		[Type]      TINYINT          NOT NULL,
		[Container] NVARCHAR (50)    NULL,
		[Position]  NVARCHAR (100)   NULL,
		PRIMARY KEY CLUSTERED ([Id]),
		CONSTRAINT [FK_Media_Container] FOREIGN KEY ([Container]) REFERENCES [dbo].[Containers] ([Name]) ON DELETE SET NULL
	);
	GO

-- Series

	CREATE TABLE [dbo].[Series] (
		[Id]          UNIQUEIDENTIFIER NOT NULL,
		[Name]        NVARCHAR (50)    NOT NULL,
		[Description] NVARCHAR (2000)  NULL,
		[Parent]      UNIQUEIDENTIFIER NULL,
		PRIMARY KEY CLUSTERED ([Id]),
		CONSTRAINT [FK_Series_Parent] FOREIGN KEY ([Parent]) REFERENCES [dbo].[Series] ([Id]),
		CONSTRAINT [U_Series_RelativeName] UNIQUE NONCLUSTERED ([Parent], [Name])
	);
	GO

	CREATE TRIGGER [dbo].[Delete_Series]
		ON [dbo].[Series]
		INSTEAD OF DELETE
		AS
		BEGIN
			SET NoCount ON
			DELETE FROM [dbo].[Links] WHERE [For] IN (Select [Id] FROM DELETED)
			UPDATE [dbo].[Series] SET [Parent] = NULL WHERE [Parent] IN (Select [Id] FROM DELETED)
			DELETE FROM [dbo].[Series] WHERE [Id] IN (Select [Id] FROM DELETED)
		END
	GO

	CREATE VIEW [dbo].[SeriesHierarchicalName] AS		
		WITH [SeriesHierarchy] ([Id], [HierarchicalName])
		AS
		(
			SELECT [s].[Id], CAST([s].[Name] AS nvarchar(max)) AS [HierarchicalName] 
			FROM [dbo].[Series] AS [s] 
			WHERE [s].[Parent] IS NULL

			UNION ALL

			SELECT [s].[Id], CAST(CONCAT([HierarchicalName], ' > ', s.[Name]) AS nvarchar(max)) 
			FROM [dbo].[Series] AS [s] 
			INNER JOIN [SeriesHierarchy] AS [h] ON [s].[Parent] = [h].[Id]
		)

		SELECT [Id], [HierarchicalName] 
		FROM [SeriesHierarchy]
	GO

-- Recordings

	CREATE TABLE [dbo].[Recordings] (
		[Id]          UNIQUEIDENTIFIER NOT NULL,
		[Name]        NVARCHAR (200)   NOT NULL,
		[RentTo]      NVARCHAR (200)   NULL,
		[Created]     DATETIME         NOT NULL,
		[Description] NVARCHAR (2000)  NULL,
		[Media]       UNIQUEIDENTIFIER NOT NULL,
		[Series]      UNIQUEIDENTIFIER NULL,
		PRIMARY KEY CLUSTERED ([Id]),
		CONSTRAINT [FK_Recordings_Media] FOREIGN KEY ([Media]) REFERENCES [dbo].[Media] ([Id]),
		CONSTRAINT [FK_Recordings_Series] FOREIGN KEY ([Series]) REFERENCES [dbo].[Series] ([Id]) ON DELETE SET NULL
	);
	GO

	CREATE NONCLUSTERED INDEX [IX_Recordings_Created]
		ON [dbo].[Recordings]([Created]);
	GO

	CREATE NONCLUSTERED INDEX [IX_Recordings_Name]
		ON [dbo].[Recordings]([Name]);
	GO

	CREATE NONCLUSTERED INDEX [IX_Recordings_Series]
		ON [dbo].[Recordings]([Series]);
	GO

	CREATE TRIGGER [dbo].[Delete_Recordings]
		ON [dbo].[Recordings]
		AFTER DELETE
		AS
		BEGIN
			SET NoCount ON
			DELETE FROM [dbo].[Links] WHERE [For] IN (Select [Id] FROM DELETED)
		END
	GO

	CREATE TRIGGER [dbo].[Update_Recordings]
		ON [dbo].[Recordings]
		AFTER DELETE, UPDATE
		AS
		BEGIN
			SET NoCount ON
			DELETE FROM [dbo].[Media] WHERE NOT ([Id] IN (SELECT [Media] FROM [dbo].[Recordings]))
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

	CREATE VIEW [dbo].[RecordingHierarchicalName] AS
		SELECT [r].[Id], IIF([r].[Series] IS NULL, [r].[Name], CONCAT([h].[HierarchicalName], ' > ', [r].[Name])) AS [HierarchicalName]
		FROM [dbo].Recordings [r]
		LEFT OUTER JOIN [dbo].[SeriesHierarchicalName] [h] ON [r].Series = [h].[Id]
	GO


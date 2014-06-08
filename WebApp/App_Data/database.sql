﻿-- Container

	CREATE TABLE [Containers] (
		[Name]				NVARCHAR (50)   NOT NULL,
		[Type]				TINYINT         NOT NULL,
		[Description]		NVARCHAR (2000) NULL,
		[Parent]			NVARCHAR (50)   NULL,
		[ParentLocation]	NVARCHAR (100)  NULL,
		PRIMARY KEY CLUSTERED ([Name]),
		CONSTRAINT [FK_Containers_Parent] FOREIGN KEY ([Parent]) REFERENCES [Containers] ([Name])
	);
	GO

	CREATE TRIGGER [Container_Delete]
		ON [Containers]
		INSTEAD OF DELETE
		AS
		BEGIN
			SET NoCount ON
			UPDATE [Containers] SET [Parent] = NULL, [ParentLocation] = NULL WHERE [Parent] IN (SELECT Name FROM DELETED)
			DELETE FROM [Containers] WHERE [Name] IN (SELECT Name FROM DELETED)
		END
	GO

-- Genre

	CREATE TABLE [Genres] (
		[Short] NVARCHAR (20)  NOT NULL,
		[Long]  NVARCHAR (100) NOT NULL,
		PRIMARY KEY CLUSTERED ([Short]),
		CONSTRAINT [U_Genres_Long] UNIQUE ([Long]) 
	);
	GO

-- Language

	CREATE TABLE [Languages] (
		[Short] NCHAR (2)      NOT NULL,
		[Long]  NVARCHAR (100) NOT NULL,
		PRIMARY KEY CLUSTERED ([Short]),
		CONSTRAINT [U_Languages_Long] UNIQUE ([Long]) 
	);
	GO

-- Links

	CREATE TABLE [Links] (
		[For]         UNIQUEIDENTIFIER NOT NULL,
		[Url]         NVARCHAR (2000)  NOT NULL,
		[Name]        NVARCHAR (100)   NOT NULL,
		[Description] NVARCHAR (2000)  NULL,
		[Ordinal]     INT              NOT NULL,
		CONSTRAINT [U_Links_ForOrdinal] UNIQUE ([For], [Ordinal])
	);
	GO

	CREATE NONCLUSTERED INDEX [IX_Links_For]
		ON [Links]([For]);
	GO

	CREATE NONCLUSTERED INDEX [IX_Links_Ordinal]
		ON [Links]([Ordinal]);
	GO

-- Media

	CREATE TABLE [Media] (
		[Id]        UNIQUEIDENTIFIER NOT NULL,
		[Type]      TINYINT          NOT NULL,
		[Container] NVARCHAR (50)    NULL,
		[Position]  NVARCHAR (100)   NULL,
		PRIMARY KEY CLUSTERED ([Id]),
		CONSTRAINT [FK_Media_Container] FOREIGN KEY ([Container]) REFERENCES [Containers] ([Name]) ON DELETE SET NULL
	);
	GO

-- Series

	CREATE TABLE [Series] (
		[Id]          UNIQUEIDENTIFIER NOT NULL,
		[Name]        NVARCHAR (50)    NOT NULL,
		[Description] NVARCHAR (2000)  NULL,
		[Parent]      UNIQUEIDENTIFIER NULL,
		PRIMARY KEY CLUSTERED ([Id]),
		CONSTRAINT [FK_Series_Parent] FOREIGN KEY ([Parent]) REFERENCES [Series] ([Id]),
		CONSTRAINT [U_Series_RelativeName] UNIQUE NONCLUSTERED ([Parent], [Name])
	);
	GO

	CREATE TRIGGER [Series_Delete]
		ON [Series]
		INSTEAD OF DELETE
		AS
		BEGIN
			SET NoCount ON
			DELETE FROM [Links] WHERE [For] IN (Select [Id] FROM DELETED)
			UPDATE [Series] SET [Parent] = NULL WHERE [Parent] IN (Select [Id] FROM DELETED)
			DELETE FROM [Series] WHERE [Id] IN (Select [Id] FROM DELETED)
		END
	GO

	-- Dieser TRIGGER sorgt dafür, dass für alle von einer Serienänderung betroffenen Aufzeichnungen die hierarchischen Namen neu berechnet werden
	CREATE TRIGGER [Series_Recordings]
		ON [Series]
		AFTER INSERT, UPDATE, DELETE
		AS
		BEGIN
			SET NoCount ON

			UPDATE [Recordings]
			SET [HierarchicalName] = NULL
			WHERE [Series] IN 			
			(
				-- Das sind die tatsächlich veränderten Serien
				SELECT [Id] FROM INSERTED UNION SELECT [Id] FROM DELETED 
				
				UNION ALL

				-- Wird müssen aber noch die gesamte Vererbungslinie verfolgen
				SELECT [Child] FROM [SeriesHierarchy] WHERE [Parent] IN (SELECT [Id] FROM INSERTED UNION ALL SELECT [Id] FROM DELETED)
			)
		END
	GO

	CREATE NONCLUSTERED INDEX [IX_Series_Parent]
		ON [Series]([Parent]);
	GO

	CREATE VIEW [SeriesHierarchicalName] AS		
		WITH [SeriesHierarchy] ([Id], [HierarchicalName])
		AS
		(
			SELECT [s].[Id], CAST([s].[Name] AS nvarchar(4000)) AS [HierarchicalName] 
			FROM [Series] AS [s] 
			WHERE [s].[Parent] IS NULL

			UNION ALL

			SELECT [s].[Id], CAST(CONCAT([HierarchicalName], ' > ', s.[Name]) AS nvarchar(4000)) 
			FROM [Series] AS [s] 
			JOIN [SeriesHierarchy] AS [h] ON [s].[Parent] = [h].[Id]
		)

		SELECT [Id], [HierarchicalName] 
		FROM [SeriesHierarchy]
	GO

	-- Dieser VIEW liefert zu jeder Serie ALLE übergeordneten Serien und nicht nur den direkten Vorgänger
	CREATE VIEW [SeriesHierarchy] AS		
		WITH [SeriesHierarchy] ([Parent], [Child], [Depth])
		AS
		(
			SELECT [s].[Parent] AS [Parent], [s].[Id] AS [Child], 0 AS [Depth]
			FROM [Series] AS [s] 

			UNION ALL

			SELECT [s].[Parent], [h].[Child], [h].[Depth] + 1
			FROM [Series] AS [s] 
			JOIN [SeriesHierarchy] AS [h] ON [s].[Id] = [h].[Parent]
			WHERE [s].[Parent] IS NOT NULL
		)

		SELECT [Parent], [Child], [Depth]
		FROM [SeriesHierarchy] AS [h]
	GO

-- Recordings

	CREATE TABLE [Recordings] (
		[Id]				UNIQUEIDENTIFIER NOT NULL,
		[Name]				NVARCHAR (200)   NOT NULL,
		[RentTo]			NVARCHAR (200)   NULL,
		[Created]			DATETIME         NOT NULL,
		[Description]		NVARCHAR (2000)  NULL,
		[Media]				UNIQUEIDENTIFIER NOT NULL,
		[Series]			UNIQUEIDENTIFIER NULL,
		[HierarchicalName]	NVARCHAR(4000)	 NULL
		PRIMARY KEY CLUSTERED ([Id]),
		CONSTRAINT [FK_Recordings_Media] FOREIGN KEY ([Media]) REFERENCES [Media] ([Id]),
		CONSTRAINT [FK_Recordings_Series] FOREIGN KEY ([Series]) REFERENCES [Series] ([Id]) ON DELETE SET NULL
	);
	GO

	CREATE NONCLUSTERED INDEX [IX_Recordings_Created]
		ON [Recordings]([Created]);
	GO

	CREATE NONCLUSTERED INDEX [IX_Recordings_Name]
		ON [Recordings]([Name]);
	GO

	CREATE NONCLUSTERED INDEX [IX_Recordings_HierarchicalName]
		ON [Recordings]([HierarchicalName]);
	GO

	CREATE NONCLUSTERED INDEX [IX_Recordings_Series]
		ON [Recordings]([Series]);
	GO

	CREATE TRIGGER [Recordings_Links]
		ON [Recordings]
		AFTER DELETE
		AS
		BEGIN
			SET NoCount ON
			DELETE FROM [Links] WHERE [For] IN (Select [Id] FROM DELETED)
		END
	GO

	CREATE TRIGGER [Recordings_Media]
		ON [Recordings]
		AFTER DELETE, UPDATE
		AS
		BEGIN
			SET NoCount ON
			DELETE FROM [Media] WHERE NOT ([Id] IN (SELECT [Media] FROM [Recordings]))
		END
	GO

	-- Dieser TRIGGER berechnet für alle veränderten Aufzeichnungen den hierarchischen Namen neu
	CREATE TRIGGER [Recordings_FullName]
		ON [Recordings]
		AFTER INSERT, UPDATE
		AS
		BEGIN
			SET NoCount ON
			
			UPDATE [Recordings]
			SET	[Recordings].[HierarchicalName] = IIF([Recordings].[Series] IS NULL, [Recordings].[Name], CONCAT([SeriesHierarchicalName].[HierarchicalName], ' > ', [Recordings].[Name]))
			FROM [Recordings]
   		    LEFT OUTER JOIN [SeriesHierarchicalName] ON [Recordings].[Series] = [SeriesHierarchicalName].[Id]
			WHERE [Recordings].[Id] IN (SELECT [Id] FROM INSERTED)
		END
	GO

	CREATE TABLE [RecordingGenres] (
		[Genre]     NVARCHAR (20)    NOT NULL,
		[Recording] UNIQUEIDENTIFIER NOT NULL,
		CONSTRAINT [FK_RecordingGenres_Genre] FOREIGN KEY ([Genre]) REFERENCES [Genres] ([Short]) ON DELETE CASCADE,
		CONSTRAINT [FK_RecordingGenres_Recording] FOREIGN KEY ([Recording]) REFERENCES [Recordings] ([Id]) ON DELETE CASCADE
	);
	GO

	CREATE NONCLUSTERED INDEX [IX_RecordingGenres_Genre]
		ON [RecordingGenres]([Genre]);
	GO

	CREATE NONCLUSTERED INDEX [IX_RecordingGenres_Recording]
		ON [RecordingGenres]([Recording]);
	GO

	CREATE TABLE [RecordingLanguages] (
		[Language]  NCHAR (2)        NOT NULL,
		[Recording] UNIQUEIDENTIFIER NOT NULL,
		CONSTRAINT [FK_RecordingLanguages_Language] FOREIGN KEY ([Language]) REFERENCES [Languages] ([Short]) ON DELETE CASCADE,
		CONSTRAINT [FK_RecordingLanguages_Recording] FOREIGN KEY ([Recording]) REFERENCES [Recordings] ([Id]) ON DELETE CASCADE
	);
	GO

	CREATE NONCLUSTERED INDEX [IX_RecordingLanguages_Language]
		ON [RecordingLanguages]([Language]);
	GO

	CREATE NONCLUSTERED INDEX [IX_RecordingLanguages_Recording]
		ON [RecordingLanguages]([Recording]);
	GO


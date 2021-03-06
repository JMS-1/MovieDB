﻿-- Aufbewahrungen

	CREATE TABLE [Containers] (
		[Id]				UNIQUEIDENTIFIER	NOT NULL,
		[Name]				NVARCHAR (50)		NOT NULL,
		[Type]				TINYINT				NOT NULL,
		[Description]		NVARCHAR (2000)		NULL,
		[Parent]			UNIQUEIDENTIFIER	NULL,
		[ParentLocation]	NVARCHAR (100)		NULL,
		PRIMARY KEY CLUSTERED ([Id]),
		CONSTRAINT [U_Containers_Name] UNIQUE ([Name]) ,
		CONSTRAINT [FK_Containers_Parent] FOREIGN KEY ([Parent]) REFERENCES [Containers] ([Id])
	);
	GO

	CREATE NONCLUSTERED INDEX [IX_Container_Parent]
		ON [Containers]([Parent]);
	GO

	-- Wir möchten hier beim Löschen einer Aufbewahrung nicht einfach nur die Referenz aller untergeordneten
	-- Aufbewahrungen auf NULL setzen (das könnte der FOREIGN KEY natürlich auch schon alleine), sondern auch
	-- den Vermerk der relativen Position entfernen.
	CREATE TRIGGER [Container_Delete]
		ON [Containers]
		INSTEAD OF DELETE
		AS
		BEGIN
			SET NoCount ON
			UPDATE [Containers] SET [Parent] = NULL, [ParentLocation] = NULL WHERE [Parent] IN (SELECT [Id] FROM DELETED)
			DELETE FROM [Containers] WHERE [Id] IN (SELECT [Id] FROM DELETED)
		END
	GO

-- Kategorien

	CREATE TABLE [Genres] (
		[Id]	UNIQUEIDENTIFIER	NOT NULL,
		[Long]	NVARCHAR (100)		NOT NULL,
		PRIMARY KEY CLUSTERED ([Id]),
		CONSTRAINT [U_Genres_Long] UNIQUE ([Long]) 
	);
	GO

-- Sprachen

	CREATE TABLE [Languages] (
		[Id]	UNIQUEIDENTIFIER	NOT NULL,
		[Long]	NVARCHAR (100)		NOT NULL,
		PRIMARY KEY CLUSTERED ([Id]),
		CONSTRAINT [U_Languages_Long] UNIQUE ([Long]) 
	);
	GO

-- Verweise (in der ersten version noch nicht genutzt)

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

-- Physikalische Ablage

	CREATE TABLE [Media] (
		[Id]		UNIQUEIDENTIFIER	NOT NULL,
		[Type]		TINYINT				NOT NULL,
		[Container]	UNIQUEIDENTIFIER	NULL,
		[Position]	NVARCHAR (100)		NULL,
		PRIMARY KEY CLUSTERED ([Id]),
		CONSTRAINT [FK_Media_Container] FOREIGN KEY ([Container]) REFERENCES [Containers] ([Id]) ON DELETE SET NULL
	);
	GO

-- Serien

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

	CREATE NONCLUSTERED INDEX [IX_Series_Parent]
		ON [Series]([Parent]);
	GO

	-- Da wir hier einen FOREIGN KEY in die selbe Tabelle haben funktioniert das ON DELETE SET NULL leider nicht
	-- und wir müssen das von Hand nachstellen.
	CREATE TRIGGER [Series_Delete]
		ON [Series]
		INSTEAD OF DELETE
		AS
		BEGIN
			SET NoCount ON
			DELETE FROM [Links] WHERE [For] IN (Select [Id] FROM DELETED)

			-- Das wäre eigentlich das ON DELETE SET NULL
			UPDATE [Series] SET [Parent] = NULL WHERE [Parent] IN (Select [Id] FROM DELETED)
			DELETE FROM [Series] WHERE [Id] IN (Select [Id] FROM DELETED)
		END
	GO

	-- Dieser TRIGGER sorgt dafür, dass für alle von einer Serienänderung betroffenen Aufzeichnungen die hierarchischen
	-- Namen neu berechnet werden. Das ist zwar etwas teuer, beschleunigt aber die Suchoperationen durch die dadurch
	-- eingeführte Redundanz ganz erheblich.
	CREATE TRIGGER [Series_RecordingName]
		ON [Series]
		AFTER INSERT, UPDATE, DELETE
		AS
		BEGIN
			SET NoCount ON

			-- Hier nutzen wir einfach das kaskadieren der TRIGGER aus und müssen den Code nicht zweimal schreiben
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

	-- Dieser VIEW liefert zu jeder Serie ALLE übergeordneten Serien und nicht nur den direkten Vorgänger
	CREATE VIEW [SeriesHierarchy] AS		
		WITH [SeriesHierarchy] ([Parent], [Child], [RelativeName], [Depth])
		AS
		(
			SELECT [s].[Parent] AS [Parent], [s].[Id] AS [Child], CAST([s].[Name] AS nvarchar(4000)) AS [RelativeName], 0 AS [Depth]
			FROM [Series] AS [s] 

			UNION ALL

			SELECT [s].[Parent], [h].[Child], CAST(CONCAT(s.[Name], ' > ', [h].[RelativeName]) AS nvarchar(4000)), [h].[Depth] + 1
			FROM [Series] AS [s] 
			JOIN [SeriesHierarchy] AS [h] ON [s].[Id] = [h].[Parent]
			WHERE [s].[Parent] IS NOT NULL
		)

		SELECT [Parent], [Child], [RelativeName], [Depth]
		FROM [SeriesHierarchy]
	GO

-- Aufzeichnungen

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

	-- Da die Verweise Fremdschlüssel gegen zwei Tabellen müssen wir diese von Hand entfernen
	CREATE TRIGGER [Recordings_Links]
		ON [Recordings]
		AFTER DELETE
		AS
		BEGIN
			SET NoCount ON
			DELETE FROM [Links] WHERE [For] IN (Select [Id] FROM DELETED)
		END
	GO

	-- Die physikalischen Ablagen werden blind bereinigt, wenn sich Aufzeichnungen verändern: es
	-- gibt keine Ablagen ohne dass mindestens eine Aufzeichnung darauf eine Referenz hält. Da
	-- wir keinen Referenzzähler führen gehen wir hier den teueren Weg der vollständigen Prüfung
	-- über alle noch verbleibenden Aufzeichnungen.
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
	CREATE TRIGGER [Recordings_Name]
		ON [Recordings]
		AFTER INSERT, UPDATE
		AS
		BEGIN
			SET NoCount ON			

			UPDATE [Recordings]
			SET	
				-- Hat die Aufzeichnung keine Serie, so wird einfach der eigene Name verwendet und ansonsten der Serienname davor gesetzt
				[Recordings].[HierarchicalName] = 
					IIF(
						[Recordings].[Series] IS NULL, 
						[Recordings].[Name], 
						CONCAT([SeriesNames].[HierarchicalName], ' > ', [Recordings].[Name]))
			FROM [Recordings]   		    
			LEFT OUTER JOIN 
			(
				SELECT 
					[sh].[Child] As [Id], 
					-- Den Namen der Serie ermitteln wir aus der Serienhierarchie, wobei bei Serien mit übergeordneten Serien dieser Name erst einmal zusammen gesetzt werden muss
					IIF(
						[sh].[Parent] IS NULL, 
						[sh].[RelativeName], 
						CONCAT((SELECT [s].[Name] FROM [Series] [s] WHERE [s].[Id] = [sh].[Parent]), ' > ', [sh].[RelativeName])) AS [HierarchicalName]
				FROM 
					[SeriesHierarchy] [sh]
				WHERE
					-- Wichtig ist, dass wir den jeweils letzten Eintrag aus der Hierarchie nehmen, der direkt auf die Wurzelserie zeigt und einen geeignet aufgebauten relativen Namen bereitstellt 
					[sh].[Depth] = (SELECT MAX([h].[Depth]) FROM [SeriesHierarchy] [h] WHERE ([h].[Child] = [sh].[Child]))
			) AS [SeriesNames] ON [SeriesNames].[Id] = [Recordings].[Series]			
			WHERE 
				[Recordings].[Id] IN (SELECT [Id] FROM INSERTED)
		END
	GO

	CREATE TABLE [RecordingGenres] (
		[Genre]		UNIQUEIDENTIFIER	NOT NULL,
		[Recording]	UNIQUEIDENTIFIER	NOT NULL,
		CONSTRAINT	[FK_RecordingGenres_Genre]		FOREIGN KEY	([Genre])		REFERENCES [Genres] ([Id]),
		CONSTRAINT	[FK_RecordingGenres_Recording]	FOREIGN KEY	([Recording])	REFERENCES [Recordings] ([Id])	ON DELETE CASCADE,
		CONSTRAINT [U_RecordingGenres] UNIQUE NONCLUSTERED ([Genre], [Recording])
	);
	GO

	CREATE NONCLUSTERED INDEX [IX_RecordingGenres_Genre]
		ON [RecordingGenres]([Genre]);
	GO

	CREATE NONCLUSTERED INDEX [IX_RecordingGenres_Recording]
		ON [RecordingGenres]([Recording]);
	GO

	CREATE TABLE [RecordingLanguages] (
		[Language]	UNIQUEIDENTIFIER	NOT NULL,
		[Recording]	UNIQUEIDENTIFIER	NOT NULL,
		CONSTRAINT	[FK_RecordingLanguages_Language]	FOREIGN KEY	([Language])	REFERENCES [Languages] ([Id]),
		CONSTRAINT	[FK_RecordingLanguages_Recording]	FOREIGN KEY	([Recording])	REFERENCES [Recordings] ([Id])	ON DELETE CASCADE,
		CONSTRAINT [U_RecordingLanguages] UNIQUE NONCLUSTERED ([Language], [Recording])
	);
	GO

	CREATE NONCLUSTERED INDEX [IX_RecordingLanguages_Language]
		ON [RecordingLanguages]([Language]);
	GO

	CREATE NONCLUSTERED INDEX [IX_RecordingLanguages_Recording]
		ON [RecordingLanguages]([Recording]);
	GO


-- Additive expansion; immutable migration 001 and all existing ballots retained.
IF OBJECT_ID(N'[satire].[arena_boardroom_votes]',N'U') IS NULL
CREATE TABLE [satire].[arena_boardroom_votes](
 [voter] NVARCHAR(100) COLLATE Latin1_General_100_BIN2 NOT NULL,
 [character] NVARCHAR(100) COLLATE Latin1_General_100_BIN2 NOT NULL CHECK(character IN ('ghanta-guru','sunday-seth','mileage-maharaj')),
 [round] NVARCHAR(100) COLLATE Latin1_General_100_BIN2 NOT NULL,
 [reaction] NVARCHAR(100) COLLATE Latin1_General_100_BIN2 NOT NULL CHECK(reaction IN ('garland','shoe','finger','applause','tomato','laugh')),
 [updated_at] NVARCHAR(100) COLLATE Latin1_General_100_BIN2 NOT NULL,
 PRIMARY KEY(voter,character,round)
);
IF NOT EXISTS(SELECT 1 FROM sys.indexes WHERE object_id=OBJECT_ID(N'[satire].[arena_boardroom_votes]') AND name=N'arena_boardroom_counts')
CREATE INDEX [arena_boardroom_counts] ON [satire].[arena_boardroom_votes](round,character,reaction);
EXEC(N'CREATE OR ALTER VIEW [satire].[arena_all_votes] AS SELECT voter,character,round,reaction,updated_at FROM (SELECT voter,character,round,reaction,updated_at,ROW_NUMBER() OVER(PARTITION BY voter,character,round ORDER BY updated_at DESC,source DESC) AS position FROM (SELECT voter,character,round,reaction,updated_at,0 AS source FROM [satire].[arena_votes] UNION ALL SELECT voter,character,round,reaction,updated_at,1 AS source FROM [satire].[arena_expanded_votes] UNION ALL SELECT voter,character,round,reaction,updated_at,2 AS source FROM [satire].[arena_cast_votes] UNION ALL SELECT voter,character,round,reaction,updated_at,3 AS source FROM [satire].[arena_additions_votes] UNION ALL SELECT voter,character,round,reaction,updated_at,4 AS source FROM [satire].[arena_speakers_votes] UNION ALL SELECT voter,character,round,reaction,updated_at,5 AS source FROM [satire].[arena_anchors_votes] UNION ALL SELECT voter,character,round,reaction,updated_at,6 AS source FROM [satire].[arena_spotlight_votes] UNION ALL SELECT voter,character,round,reaction,updated_at,7 AS source FROM [satire].[arena_boardroom_votes]) AS generations) AS ranked WHERE position=1;');

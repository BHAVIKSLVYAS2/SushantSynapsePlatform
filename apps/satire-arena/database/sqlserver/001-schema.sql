-- satire schema, SQL Server 2022+ / Azure SQL. Version 1; one database.

IF SCHEMA_ID(N'satire') IS NULL EXEC(N'CREATE SCHEMA [satire] AUTHORIZATION [dbo]');

IF OBJECT_ID(N'[satire].[arena_votes]',N'U') IS NULL
CREATE TABLE [satire].[arena_votes](
 [voter] NVARCHAR(100) COLLATE Latin1_General_100_BIN2 NOT NULL,
 [character] NVARCHAR(100) COLLATE Latin1_General_100_BIN2 NOT NULL CHECK(character IN ('namo-nimbus','rally-rohan','muffler-mohan')),
 [round] NVARCHAR(100) COLLATE Latin1_General_100_BIN2 NOT NULL,
 [reaction] NVARCHAR(100) COLLATE Latin1_General_100_BIN2 NOT NULL CHECK(reaction IN ('garland','shoe','finger')),
 [updated_at] NVARCHAR(100) COLLATE Latin1_General_100_BIN2 NOT NULL,
 PRIMARY KEY(voter,character,round)
);

IF OBJECT_ID(N'[satire].[arena_expanded_votes]',N'U') IS NULL
CREATE TABLE [satire].[arena_expanded_votes](
 [voter] NVARCHAR(100) COLLATE Latin1_General_100_BIN2 NOT NULL,
 [character] NVARCHAR(100) COLLATE Latin1_General_100_BIN2 NOT NULL CHECK(character IN ('namo-nimbus','rally-rohan','muffler-mohan','briefcase-babu','drumroll-didi','coalition-chacha')),
 [round] NVARCHAR(100) COLLATE Latin1_General_100_BIN2 NOT NULL,
 [reaction] NVARCHAR(100) COLLATE Latin1_General_100_BIN2 NOT NULL CHECK(reaction IN ('garland','shoe','finger','applause','tomato','laugh')),
 [updated_at] NVARCHAR(100) COLLATE Latin1_General_100_BIN2 NOT NULL,
 PRIMARY KEY(voter,character,round)
);

IF OBJECT_ID(N'[satire].[arena_cast_votes]',N'U') IS NULL
CREATE TABLE [satire].[arena_cast_votes](
 [voter] NVARCHAR(100) COLLATE Latin1_General_100_BIN2 NOT NULL,
 [character] NVARCHAR(100) COLLATE Latin1_General_100_BIN2 NOT NULL CHECK(character IN ('namo-nimbus','rally-rohan','muffler-mohan','briefcase-babu','drumroll-didi','coalition-chacha','saffron-sage','cycle-captain','lexicon-lord')),
 [round] NVARCHAR(100) COLLATE Latin1_General_100_BIN2 NOT NULL,
 [reaction] NVARCHAR(100) COLLATE Latin1_General_100_BIN2 NOT NULL CHECK(reaction IN ('garland','shoe','finger','applause','tomato','laugh')),
 [updated_at] NVARCHAR(100) COLLATE Latin1_General_100_BIN2 NOT NULL,
 PRIMARY KEY(voter,character,round)
);

IF NOT EXISTS(SELECT 1 FROM sys.indexes WHERE object_id=OBJECT_ID(N'[satire].[arena_votes]') AND name=N'arena_round_counts')
CREATE INDEX [arena_round_counts] ON [satire].[arena_votes](round,character,reaction);

IF NOT EXISTS(SELECT 1 FROM sys.indexes WHERE object_id=OBJECT_ID(N'[satire].[arena_expanded_votes]') AND name=N'arena_expanded_counts')
CREATE INDEX [arena_expanded_counts] ON [satire].[arena_expanded_votes](round,character,reaction);

IF NOT EXISTS(SELECT 1 FROM sys.indexes WHERE object_id=OBJECT_ID(N'[satire].[arena_cast_votes]') AND name=N'arena_cast_counts')
CREATE INDEX [arena_cast_counts] ON [satire].[arena_cast_votes](round,character,reaction);

EXEC(N'CREATE OR ALTER VIEW [satire].[arena_all_votes] AS SELECT voter,character,round,reaction,updated_at FROM (SELECT voter,character,round,reaction,updated_at,ROW_NUMBER() OVER(PARTITION BY voter,character,round ORDER BY updated_at DESC,source DESC) AS position FROM (SELECT voter,character,round,reaction,updated_at,0 AS source FROM [satire].[arena_votes] UNION ALL SELECT voter,character,round,reaction,updated_at,1 AS source FROM [satire].[arena_expanded_votes] UNION ALL SELECT voter,character,round,reaction,updated_at,2 AS source FROM [satire].[arena_cast_votes]) AS generations) AS ranked WHERE position=1;');

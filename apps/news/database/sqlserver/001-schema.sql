-- news schema, SQL Server 2022+ / Azure SQL. Version 1; one database.

IF SCHEMA_ID(N'news') IS NULL EXEC(N'CREATE SCHEMA [news] AUTHORIZATION [dbo]');

IF OBJECT_ID(N'[news].[news_migrations]',N'U') IS NULL
CREATE TABLE [news].[news_migrations](
 [version] BIGINT NOT NULL PRIMARY KEY,
 [appliedAt] NVARCHAR(100) COLLATE Latin1_General_100_BIN2 NOT NULL
);

IF OBJECT_ID(N'[news].[news_editions]',N'U') IS NULL
CREATE TABLE [news].[news_editions](
 [date] NVARCHAR(100) COLLATE Latin1_General_100_BIN2 NOT NULL PRIMARY KEY,
 [name] NVARCHAR(2000) COLLATE Latin1_General_100_BIN2 NOT NULL,
 [author] NVARCHAR(100) COLLATE Latin1_General_100_BIN2 NOT NULL,
 [cutoff] NVARCHAR(100) COLLATE Latin1_General_100_BIN2 NOT NULL,
 [publishedAt] NVARCHAR(100) COLLATE Latin1_General_100_BIN2 NOT NULL,
 [satireTitle] NVARCHAR(100) COLLATE Latin1_General_100_BIN2 NOT NULL,
 [satireBody] NVARCHAR(MAX) COLLATE Latin1_General_100_BIN2 NOT NULL,
 [satireStory] BIGINT NOT NULL CHECK(satireStory BETWEEN 1 AND 10),
 [model] NVARCHAR(100) COLLATE Latin1_General_100_BIN2 NOT NULL,
 [promptVersion] NVARCHAR(100) COLLATE Latin1_General_100_BIN2 NOT NULL
);

IF OBJECT_ID(N'[news].[news_stories]',N'U') IS NULL
CREATE TABLE [news].[news_stories](
 [editionDate] NVARCHAR(100) COLLATE Latin1_General_100_BIN2 NOT NULL REFERENCES [news].[news_editions]([date]),
 [position] BIGINT NOT NULL CHECK(position BETWEEN 1 AND 10),
 [title] NVARCHAR(2000) COLLATE Latin1_General_100_BIN2 NOT NULL,
 [brief] NVARCHAR(MAX) COLLATE Latin1_General_100_BIN2 NOT NULL,
 [source] NVARCHAR(100) COLLATE Latin1_General_100_BIN2 NOT NULL,
 [url] NVARCHAR(2000) COLLATE Latin1_General_100_BIN2 NOT NULL,
 [publishedAt] NVARCHAR(100) COLLATE Latin1_General_100_BIN2 NOT NULL,
 PRIMARY KEY(editionDate,position),
 UNIQUE(editionDate,url_hash),
 url_hash AS CONVERT(BINARY(32),HASHBYTES('SHA2_256',url)) PERSISTED
);

IF OBJECT_ID(N'[news].[news_runs]',N'U') IS NULL
CREATE TABLE [news].[news_runs](
 [date] NVARCHAR(100) COLLATE Latin1_General_100_BIN2 NOT NULL PRIMARY KEY,
 [cutoff] NVARCHAR(100) COLLATE Latin1_General_100_BIN2 NOT NULL,
 [state] NVARCHAR(100) COLLATE Latin1_General_100_BIN2 NOT NULL CHECK(state IN ('pending','running','failed','published')),
 [sourceJson] NVARCHAR(MAX) COLLATE Latin1_General_100_BIN2 NOT NULL DEFAULT '[]',
 [attempts] BIGINT NOT NULL DEFAULT 0,
 [leaseToken] NVARCHAR(100) COLLATE Latin1_General_100_BIN2,
 [leaseUntil] NVARCHAR(100) COLLATE Latin1_General_100_BIN2,
 [error] NVARCHAR(100) COLLATE Latin1_General_100_BIN2,
 [createdAt] NVARCHAR(100) COLLATE Latin1_General_100_BIN2 NOT NULL,
 [updatedAt] NVARCHAR(100) COLLATE Latin1_General_100_BIN2 NOT NULL
);

IF OBJECT_ID(N'[news].[news_fetch_budget]',N'U') IS NULL
CREATE TABLE [news].[news_fetch_budget](
 [day] NVARCHAR(100) COLLATE Latin1_General_100_BIN2 NOT NULL PRIMARY KEY,
 [requests] BIGINT NOT NULL DEFAULT 0 CHECK(requests >= 0)
);

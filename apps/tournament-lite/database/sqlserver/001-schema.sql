-- tournament schema, SQL Server 2022+ / Azure SQL. Version 1; one database.

IF SCHEMA_ID(N'tournament') IS NULL EXEC(N'CREATE SCHEMA [tournament] AUTHORIZATION [dbo]');

IF OBJECT_ID(N'[tournament].[tournament_lite_events]',N'U') IS NULL
CREATE TABLE [tournament].[tournament_lite_events](
 [id] NVARCHAR(100) COLLATE Latin1_General_100_BIN2 NOT NULL PRIMARY KEY,
 [owner] NVARCHAR(100) COLLATE Latin1_General_100_BIN2 NOT NULL,
 [revision] BIGINT NOT NULL,
 [public_token] NVARCHAR(100) COLLATE Latin1_General_100_BIN2 NOT NULL UNIQUE,
 [data] NVARCHAR(MAX) COLLATE Latin1_General_100_BIN2 NOT NULL
);

IF OBJECT_ID(N'[tournament].[tournament_lite_migrations]',N'U') IS NULL
CREATE TABLE [tournament].[tournament_lite_migrations](
 [version] BIGINT NOT NULL PRIMARY KEY
);

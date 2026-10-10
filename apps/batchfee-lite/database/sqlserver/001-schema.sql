-- batchfee schema, SQL Server 2022+ / Azure SQL. Version 1; one database.

IF SCHEMA_ID(N'batchfee') IS NULL EXEC(N'CREATE SCHEMA [batchfee] AUTHORIZATION [dbo]');

IF OBJECT_ID(N'[batchfee].[batchfee_migrations]',N'U') IS NULL
CREATE TABLE [batchfee].[batchfee_migrations](
 [version] BIGINT NOT NULL PRIMARY KEY
);

IF OBJECT_ID(N'[batchfee].[batchfee_workspace]',N'U') IS NULL
CREATE TABLE [batchfee].[batchfee_workspace](
 [id] BIGINT NOT NULL PRIMARY KEY CHECK(id=1),
 [revision] BIGINT NOT NULL DEFAULT 0,
 [data] NVARCHAR(MAX) COLLATE Latin1_General_100_BIN2 NOT NULL CHECK(ISJSON(data, VALUE)=1)
);

IF OBJECT_ID(N'[batchfee].[batchfee_events]',N'U') IS NULL
CREATE TABLE [batchfee].[batchfee_events](
 [id] BIGINT IDENTITY(1,1) NOT NULL PRIMARY KEY ,
 [at] NVARCHAR(100) COLLATE Latin1_General_100_BIN2 NOT NULL,
 [actor] NVARCHAR(100) COLLATE Latin1_General_100_BIN2 NOT NULL,
 [action] NVARCHAR(100) COLLATE Latin1_General_100_BIN2 NOT NULL,
 [data] NVARCHAR(MAX) COLLATE Latin1_General_100_BIN2 NOT NULL CHECK(ISJSON(data, VALUE)=1)
);

IF OBJECT_ID(N'[batchfee].[batchfee_staff]',N'U') IS NULL
CREATE TABLE [batchfee].[batchfee_staff](
 [user_id] NVARCHAR(100) COLLATE Latin1_General_100_BIN2 NOT NULL PRIMARY KEY REFERENCES [platform].[users]([id]),
 [role] NVARCHAR(100) COLLATE Latin1_General_100_BIN2 NOT NULL CHECK(role IN ('Viewer','Collector','Manager'))
);

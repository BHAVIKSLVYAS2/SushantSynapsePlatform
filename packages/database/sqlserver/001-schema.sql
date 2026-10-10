-- platform schema, SQL Server 2022+ / Azure SQL. Version 1; one database.

IF SCHEMA_ID(N'platform') IS NULL EXEC(N'CREATE SCHEMA [platform] AUTHORIZATION [dbo]');

IF OBJECT_ID(N'[platform].[users]',N'U') IS NULL
CREATE TABLE [platform].[users](
 [id] NVARCHAR(100) COLLATE Latin1_General_100_BIN2 NOT NULL PRIMARY KEY,
 [name] NVARCHAR(2000) COLLATE Latin1_General_100_BIN2 NOT NULL,
 [email] NVARCHAR(200) COLLATE Latin1_General_100_BIN2 NOT NULL UNIQUE,
 [role] NVARCHAR(100) COLLATE Latin1_General_100_BIN2 NOT NULL CHECK (role IN ('Owner', 'Advocate', 'Clerk')),
 [password] NVARCHAR(512) COLLATE Latin1_General_100_BIN2 NOT NULL,
 [active] BIGINT NOT NULL DEFAULT 1 CHECK (active IN (0, 1))
);

IF OBJECT_ID(N'[platform].[sessions]',N'U') IS NULL
CREATE TABLE [platform].[sessions](
 [token] NVARCHAR(100) COLLATE Latin1_General_100_BIN2 NOT NULL PRIMARY KEY,
 [userId] NVARCHAR(100) COLLATE Latin1_General_100_BIN2 NOT NULL REFERENCES [platform].[users]([id]),
 [expires] BIGINT NOT NULL
);

IF OBJECT_ID(N'[platform].[audit]',N'U') IS NULL
CREATE TABLE [platform].[audit](
 [id] BIGINT IDENTITY(1,1) NOT NULL PRIMARY KEY ,
 [at] NVARCHAR(100) COLLATE Latin1_General_100_BIN2 NOT NULL,
 [actor] NVARCHAR(100) COLLATE Latin1_General_100_BIN2 NOT NULL,
 [action] NVARCHAR(100) COLLATE Latin1_General_100_BIN2 NOT NULL,
 [kind] NVARCHAR(100) COLLATE Latin1_General_100_BIN2 NOT NULL,
 [recordId] NVARCHAR(100) COLLATE Latin1_General_100_BIN2 NOT NULL,
 [label] NVARCHAR(2000) COLLATE Latin1_General_100_BIN2 NOT NULL
);

IF OBJECT_ID(N'[platform].[settings]',N'U') IS NULL
CREATE TABLE [platform].[settings](
 [id] NVARCHAR(100) COLLATE Latin1_General_100_BIN2 NOT NULL PRIMARY KEY,
 [data] NVARCHAR(MAX) COLLATE Latin1_General_100_BIN2 NOT NULL CHECK (ISJSON(data, VALUE)=1)
);

IF OBJECT_ID(N'[platform].[app_access]',N'U') IS NULL
CREATE TABLE [platform].[app_access](
 [userId] NVARCHAR(100) COLLATE Latin1_General_100_BIN2 NOT NULL REFERENCES [platform].[users]([id]),
 [appId] NVARCHAR(100) COLLATE Latin1_General_100_BIN2 NOT NULL,
 PRIMARY KEY (userId, appId)
);

IF OBJECT_ID(N'[platform].[platform_preferences]',N'U') IS NULL
CREATE TABLE [platform].[platform_preferences](
 [userId] NVARCHAR(100) COLLATE Latin1_General_100_BIN2 NOT NULL PRIMARY KEY REFERENCES [platform].[users]([id]),
 [data] NVARCHAR(MAX) COLLATE Latin1_General_100_BIN2 NOT NULL CHECK (ISJSON(data, VALUE)=1)
);

IF NOT EXISTS(SELECT 1 FROM sys.indexes WHERE object_id=OBJECT_ID(N'[platform].[sessions]') AND name=N'sessions_expiry')
CREATE INDEX [sessions_expiry] ON [platform].[sessions](expires);

IF NOT EXISTS(SELECT 1 FROM sys.indexes WHERE object_id=OBJECT_ID(N'[platform].[sessions]') AND name=N'sessions_user')
CREATE INDEX [sessions_user] ON [platform].[sessions](userId);

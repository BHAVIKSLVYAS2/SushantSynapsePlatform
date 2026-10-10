-- fundlens schema, SQL Server 2022+ / Azure SQL. Version 1; one database.

IF SCHEMA_ID(N'fundlens') IS NULL EXEC(N'CREATE SCHEMA [fundlens] AUTHORIZATION [dbo]');

IF OBJECT_ID(N'[fundlens].[fund_lens_migrations]',N'U') IS NULL
CREATE TABLE [fundlens].[fund_lens_migrations](
 [version] BIGINT NOT NULL PRIMARY KEY,
 [appliedAt] NVARCHAR(100) COLLATE Latin1_General_100_BIN2 NOT NULL
);

IF OBJECT_ID(N'[fundlens].[fund_lens_portfolios]',N'U') IS NULL
CREATE TABLE [fundlens].[fund_lens_portfolios](
 [userId] NVARCHAR(100) COLLATE Latin1_General_100_BIN2 NOT NULL PRIMARY KEY REFERENCES [platform].[users]([id]),
 [revision] BIGINT NOT NULL DEFAULT 0
);

IF OBJECT_ID(N'[fundlens].[fund_lens_transactions]',N'U') IS NULL
CREATE TABLE [fundlens].[fund_lens_transactions](
 [id] NVARCHAR(100) COLLATE Latin1_General_100_BIN2 NOT NULL PRIMARY KEY,
 [userId] NVARCHAR(100) COLLATE Latin1_General_100_BIN2 NOT NULL REFERENCES [platform].[users]([id]),
 [schemeCode] NVARCHAR(100) COLLATE Latin1_General_100_BIN2 NOT NULL,
 [schemeName] NVARCHAR(2000) COLLATE Latin1_General_100_BIN2 NOT NULL,
 [date] NVARCHAR(100) COLLATE Latin1_General_100_BIN2 NOT NULL,
 [type] NVARCHAR(100) COLLATE Latin1_General_100_BIN2 NOT NULL CHECK(type IN ('BUY','SELL','DIVIDEND')),
 [units] FLOAT(53) NOT NULL CHECK(units >= 0),
 [amount] FLOAT(53) NOT NULL CHECK(amount > 0),
 [reference] NVARCHAR(100) COLLATE Latin1_General_100_BIN2 NOT NULL DEFAULT '',
 [fingerprint] NVARCHAR(100) COLLATE Latin1_General_100_BIN2 NOT NULL,
 UNIQUE(userId,fingerprint)
);

IF NOT EXISTS(SELECT 1 FROM sys.indexes WHERE object_id=OBJECT_ID(N'[fundlens].[fund_lens_transactions]') AND name=N'fund_lens_transactions_user_date')
CREATE INDEX [fund_lens_transactions_user_date] ON [fundlens].[fund_lens_transactions](userId,date);

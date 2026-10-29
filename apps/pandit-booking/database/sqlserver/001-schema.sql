-- Catalogue compatibility only; Pandit Booking runtime is SQLite/Workers D1.
IF SCHEMA_ID(N'pandit') IS NULL EXEC(N'CREATE SCHEMA [pandit] AUTHORIZATION [dbo]');
IF OBJECT_ID(N'[pandit].[pandit_booking_workspaces]',N'U') IS NULL
CREATE TABLE [pandit].[pandit_booking_workspaces](
 [organisationId] NVARCHAR(200) COLLATE Latin1_General_100_BIN2 NOT NULL PRIMARY KEY,
 [version] BIGINT NOT NULL DEFAULT 0,
 [data] NVARCHAR(MAX) COLLATE Latin1_General_100_BIN2 NOT NULL
);

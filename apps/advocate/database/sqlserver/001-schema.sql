-- chambers schema, SQL Server 2022+ / Azure SQL. Version 1; one database.

IF SCHEMA_ID(N'chambers') IS NULL EXEC(N'CREATE SCHEMA [chambers] AUTHORIZATION [dbo]');

IF OBJECT_ID(N'[chambers].[records]',N'U') IS NULL
CREATE TABLE [chambers].[records](
 [kind] NVARCHAR(100) COLLATE Latin1_General_100_BIN2 NOT NULL,
 [id] NVARCHAR(100) COLLATE Latin1_General_100_BIN2 NOT NULL,
 [data] NVARCHAR(MAX) COLLATE Latin1_General_100_BIN2 NOT NULL CHECK (ISJSON(data, VALUE)=1),
 PRIMARY KEY (kind, id),
 case_key AS CONVERT(NVARCHAR(100),JSON_VALUE(data,'$.caseId')) PERSISTED,
 client_key AS CONVERT(NVARCHAR(100),JSON_VALUE(data,'$.clientId')) PERSISTED,
 invoice_key AS CONVERT(NVARCHAR(100),JSON_VALUE(data,'$.invoiceId')) PERSISTED,
 created_order BIGINT IDENTITY(1,1) NOT NULL
);

IF OBJECT_ID(N'[chambers].[files]',N'U') IS NULL
CREATE TABLE [chambers].[files](
 [id] NVARCHAR(100) COLLATE Latin1_General_100_BIN2 NOT NULL PRIMARY KEY,
 [name] NVARCHAR(2000) COLLATE Latin1_General_100_BIN2 NOT NULL,
 [mime] NVARCHAR(100) COLLATE Latin1_General_100_BIN2 NOT NULL,
 [content] VARBINARY(MAX) NOT NULL
);

IF NOT EXISTS(SELECT 1 FROM sys.indexes WHERE object_id=OBJECT_ID(N'[chambers].[records]') AND name=N'records_case')
CREATE INDEX [records_case] ON [chambers].[records](kind,case_key);

IF NOT EXISTS(SELECT 1 FROM sys.indexes WHERE object_id=OBJECT_ID(N'[chambers].[records]') AND name=N'records_client')
CREATE INDEX [records_client] ON [chambers].[records](kind,client_key);

IF NOT EXISTS(SELECT 1 FROM sys.indexes WHERE object_id=OBJECT_ID(N'[chambers].[records]') AND name=N'records_invoice')
CREATE INDEX [records_invoice] ON [chambers].[records](kind,invoice_key);

EXEC(N'CREATE OR ALTER VIEW [chambers].[clients] AS SELECT id, JSON_VALUE(data, ''$.name'') AS name,
       JSON_VALUE(data, ''$.email'') AS email,
       JSON_VALUE(data, ''$.phone'') AS phone,
       CASE WHEN JSON_VALUE(data,''$.archived'')=''true'' THEN 1 ELSE 0 END AS archived, data
FROM [chambers].[records] WHERE kind = ''clients'';');

EXEC(N'CREATE OR ALTER VIEW [chambers].[cases] AS SELECT id, JSON_VALUE(data, ''$.title'') AS title,
       JSON_VALUE(data, ''$.clientId'') AS client_id,
       JSON_VALUE(data, ''$.number'') AS case_number,
       JSON_VALUE(data, ''$.cnr'') AS cnr,
       JSON_VALUE(data, ''$.court'') AS court,
       JSON_VALUE(data, ''$.status'') AS status,
       CASE WHEN JSON_VALUE(data,''$.archived'')=''true'' THEN 1 ELSE 0 END AS archived, data
FROM [chambers].[records] WHERE kind = ''cases'';');

EXEC(N'CREATE OR ALTER VIEW [chambers].[hearings] AS SELECT id, JSON_VALUE(data, ''$.caseId'') AS case_id,
       JSON_VALUE(data, ''$.date'') AS hearing_date,
       JSON_VALUE(data, ''$.time'') AS hearing_time,
       JSON_VALUE(data, ''$.status'') AS status,
       CASE WHEN JSON_VALUE(data,''$.archived'')=''true'' THEN 1 ELSE 0 END AS archived, data
FROM [chambers].[records] WHERE kind = ''hearings'';');

EXEC(N'CREATE OR ALTER VIEW [chambers].[invoices] AS SELECT id, JSON_VALUE(data, ''$.number'') AS invoice_number,
       JSON_VALUE(data, ''$.clientId'') AS client_id,
       JSON_VALUE(data, ''$.caseId'') AS case_id,
       CONVERT(DECIMAL(19,2),JSON_VALUE(data,''$.amount'')) AS amount,
       JSON_VALUE(data, ''$.date'') AS issue_date,
       JSON_VALUE(data, ''$.due'') AS due_date,
       CASE WHEN JSON_VALUE(data,''$.archived'')=''true'' THEN 1 ELSE 0 END AS archived, data
FROM [chambers].[records] WHERE kind = ''invoices'';');

EXEC(N'CREATE OR ALTER VIEW [chambers].[payments] AS SELECT id, JSON_VALUE(data, ''$.invoiceId'') AS invoice_id,
       CONVERT(DECIMAL(19,2),JSON_VALUE(data,''$.amount'')) AS amount,
       JSON_VALUE(data, ''$.date'') AS payment_date,
       CASE WHEN JSON_VALUE(data,''$.archived'')=''true'' THEN 1 ELSE 0 END AS archived, data
FROM [chambers].[records] WHERE kind = ''payments'';');

EXEC(N'CREATE OR ALTER VIEW [chambers].[invoice_balances] AS SELECT i.id, i.invoice_number, i.client_id, i.amount,
       COALESCE(ROUND(SUM(p.amount), 2), 0) AS paid,
       ROUND(i.amount - COALESCE(SUM(p.amount), 0), 2) AS balance
FROM [chambers].[invoices] i
LEFT JOIN [chambers].[payments] p ON p.invoice_id = i.id AND p.archived = 0
WHERE i.archived = 0
GROUP BY i.id,i.invoice_number,i.client_id,i.amount;');

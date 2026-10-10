-- Provider errors can exceed a short status code. Preserve complete historical messages.
ALTER TABLE [news].[news_runs] ALTER COLUMN [error] NVARCHAR(MAX) COLLATE Latin1_General_100_BIN2 NULL;

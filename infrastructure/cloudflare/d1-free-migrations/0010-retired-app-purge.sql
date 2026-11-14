-- Approved 2026-11-14: retired News/Fund Lens live tables only.
-- Historical migrations and offline recovery sources remain immutable.
DROP TABLE IF EXISTS news_stories;
DROP TABLE IF EXISTS news_editions;
DROP TABLE IF EXISTS news_runs;
DROP TABLE IF EXISTS news_fetch_budget;
DROP TABLE IF EXISTS news_migrations;
DROP TABLE IF EXISTS fund_lens_transactions;
DROP TABLE IF EXISTS fund_lens_portfolios;
DROP TABLE IF EXISTS fund_lens_migrations;
DELETE FROM app_access WHERE appId IN ('news', 'fund-overlap', 'fund-lens');

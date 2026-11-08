CREATE TABLE IF NOT EXISTS news_fetch_budget(
 day TEXT PRIMARY KEY, requests INTEGER NOT NULL DEFAULT 0 CHECK(requests >= 0)
);

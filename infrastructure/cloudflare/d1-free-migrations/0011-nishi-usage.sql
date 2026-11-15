-- Aggregate pilot budget only. No prompts, names, birth details or responses.
CREATE TABLE IF NOT EXISTS nishi_daily_usage (
 day TEXT PRIMARY KEY,
 calls INTEGER NOT NULL DEFAULT 0 CHECK(calls >= 0)
);

-- Additive app migration; existing identity and Chambers tables are untouched.
CREATE TABLE IF NOT EXISTS fund_lens_migrations (version INTEGER PRIMARY KEY, appliedAt TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS fund_lens_portfolios (userId TEXT PRIMARY KEY REFERENCES users(id), revision INTEGER NOT NULL DEFAULT 0);
CREATE TABLE IF NOT EXISTS fund_lens_transactions (
 id TEXT PRIMARY KEY, userId TEXT NOT NULL REFERENCES users(id),
 schemeCode TEXT NOT NULL, schemeName TEXT NOT NULL, date TEXT NOT NULL,
 type TEXT NOT NULL CHECK(type IN ('BUY','SELL','DIVIDEND')),
 units REAL NOT NULL CHECK(units >= 0), amount REAL NOT NULL CHECK(amount > 0),
 reference TEXT NOT NULL DEFAULT '', fingerprint TEXT NOT NULL,
 UNIQUE(userId,fingerprint)
);
CREATE INDEX IF NOT EXISTS fund_lens_transactions_user_date ON fund_lens_transactions(userId,date);

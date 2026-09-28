CREATE TABLE IF NOT EXISTS tournament_lite_events (id TEXT PRIMARY KEY, owner TEXT NOT NULL, revision INTEGER NOT NULL, public_token TEXT NOT NULL UNIQUE, data TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS tournament_lite_migrations (version INTEGER PRIMARY KEY);

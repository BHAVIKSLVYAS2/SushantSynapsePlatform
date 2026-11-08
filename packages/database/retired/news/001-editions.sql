-- Additive News schema. Never replace existing platform or Chambers tables.
CREATE TABLE IF NOT EXISTS news_migrations(version INTEGER PRIMARY KEY, appliedAt TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS news_editions(
 date TEXT PRIMARY KEY, name TEXT NOT NULL, author TEXT NOT NULL,
 cutoff TEXT NOT NULL, publishedAt TEXT NOT NULL,
 satireTitle TEXT NOT NULL, satireBody TEXT NOT NULL,
 satireStory INTEGER NOT NULL CHECK(satireStory BETWEEN 1 AND 10),
 model TEXT NOT NULL, promptVersion TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS news_stories(
 editionDate TEXT NOT NULL REFERENCES news_editions(date),
 position INTEGER NOT NULL CHECK(position BETWEEN 1 AND 10),
 title TEXT NOT NULL, brief TEXT NOT NULL, source TEXT NOT NULL,
 url TEXT NOT NULL, publishedAt TEXT NOT NULL,
 PRIMARY KEY(editionDate,position), UNIQUE(editionDate,url)
);
CREATE TABLE IF NOT EXISTS news_runs(
 date TEXT PRIMARY KEY, cutoff TEXT NOT NULL,
 state TEXT NOT NULL CHECK(state IN ('pending','running','failed','published')),
 sourceJson TEXT NOT NULL DEFAULT '[]', attempts INTEGER NOT NULL DEFAULT 0,
 leaseToken TEXT, leaseUntil TEXT, error TEXT,
 createdAt TEXT NOT NULL, updatedAt TEXT NOT NULL
);

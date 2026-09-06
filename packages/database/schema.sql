-- Shared identity, app access, preferences and audit tables.
PRAGMA foreign_keys = ON;
PRAGMA user_version = 2;

CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    role TEXT NOT NULL CHECK (role IN ('Owner', 'Advocate', 'Clerk')),
    password TEXT NOT NULL,
    active INTEGER NOT NULL DEFAULT 1 CHECK (active IN (0, 1))
);

CREATE TABLE IF NOT EXISTS sessions (
    token TEXT PRIMARY KEY,
    userId TEXT NOT NULL REFERENCES users(id),
    expires INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS audit (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    at TEXT NOT NULL,
    actor TEXT NOT NULL,
    action TEXT NOT NULL,
    kind TEXT NOT NULL,
    recordId TEXT NOT NULL,
    label TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS settings (
    id TEXT PRIMARY KEY,
    data TEXT NOT NULL CHECK (json_valid(data))
);

CREATE INDEX IF NOT EXISTS sessions_expiry ON sessions(expires);

CREATE INDEX IF NOT EXISTS sessions_user ON sessions(userId);

CREATE TABLE IF NOT EXISTS app_access (
    userId TEXT NOT NULL REFERENCES users(id),
    appId TEXT NOT NULL,
    PRIMARY KEY (userId, appId)
);

CREATE TABLE IF NOT EXISTS platform_preferences (
    userId TEXT PRIMARY KEY REFERENCES users(id),
    data TEXT NOT NULL CHECK (json_valid(data))
);

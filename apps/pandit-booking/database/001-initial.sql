-- Bounded transactional pilot aggregate, persisted only in SQLite/D1.
CREATE TABLE IF NOT EXISTS pandit_booking_workspaces (
 organisationId TEXT PRIMARY KEY,
 version INTEGER NOT NULL DEFAULT 0,
 data TEXT NOT NULL
);

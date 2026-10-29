-- Additive tenant boundary. Legacy academy rows remain in their original tables
-- until an explicit, verified ownership cutover maps them to an organisation.
CREATE TABLE IF NOT EXISTS batchfee_organisation_workspaces (
 organisationId TEXT PRIMARY KEY REFERENCES platform_organisations(id),
 revision INTEGER NOT NULL DEFAULT 0 CHECK(revision >= 0),
 data TEXT NOT NULL CHECK(json_valid(data))
);
CREATE TABLE IF NOT EXISTS batchfee_organisation_events (
 id INTEGER PRIMARY KEY AUTOINCREMENT,
 organisationId TEXT NOT NULL REFERENCES batchfee_organisation_workspaces(organisationId),
 at TEXT NOT NULL,
 actor TEXT NOT NULL,
 action TEXT NOT NULL,
 data TEXT NOT NULL CHECK(json_valid(data))
);
CREATE INDEX IF NOT EXISTS batchfee_organisation_events_scope
 ON batchfee_organisation_events(organisationId,id);
CREATE TABLE IF NOT EXISTS batchfee_legacy_ownership (
 legacyWorkspaceId INTEGER PRIMARY KEY CHECK(legacyWorkspaceId=1),
 organisationId TEXT NOT NULL UNIQUE REFERENCES platform_organisations(id)
);

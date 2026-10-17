-- Additive preview-only workspace configuration, audit and recovery snapshots.
CREATE TABLE chambers_workspace_settings (
 organisationId TEXT PRIMARY KEY REFERENCES platform_organisations(id),
 data TEXT NOT NULL CHECK (json_valid(data))
);
CREATE TABLE chambers_activity (
 id INTEGER PRIMARY KEY AUTOINCREMENT,
 organisationId TEXT NOT NULL REFERENCES platform_organisations(id),
 actorUserId TEXT NOT NULL REFERENCES users(id),
 actor TEXT NOT NULL,
 action TEXT NOT NULL,
 kind TEXT NOT NULL,
 recordId TEXT NOT NULL,
 label TEXT NOT NULL,
 at TEXT NOT NULL
);
CREATE INDEX chambers_activity_org ON chambers_activity(organisationId,id);
CREATE TABLE chambers_snapshots (
 id TEXT PRIMARY KEY,
 organisationId TEXT NOT NULL REFERENCES platform_organisations(id),
 bucket TEXT NOT NULL,
 at TEXT NOT NULL,
 data TEXT NOT NULL CHECK (json_valid(data)),
 UNIQUE (organisationId,bucket)
);
INSERT INTO chambers_workspace_settings(organisationId,data)
 SELECT w.organisationId,s.data FROM platform_legacy_workspaces w JOIN settings s ON s.id='firm' WHERE w.appId='advocate';

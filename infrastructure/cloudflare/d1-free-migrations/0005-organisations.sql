-- Additive organisation schema; activation remains a separate runtime flag.
CREATE TABLE platform_organisation_migrations(id TEXT PRIMARY KEY,checksum TEXT NOT NULL);
-- Opt-in SQLite foundation; not included in server startup or cloud migrations.
CREATE TABLE platform_super_admins (
 userId TEXT PRIMARY KEY REFERENCES users(id),
 active INTEGER NOT NULL CHECK (active IN (0,1)),
 createdAt INTEGER NOT NULL
);
CREATE TABLE platform_organisations (
 id TEXT PRIMARY KEY,
 name TEXT NOT NULL CHECK (length(trim(name)) BETWEEN 1 AND 160),
 type TEXT NOT NULL CHECK (length(type) BETWEEN 1 AND 80),
 timezone TEXT NOT NULL,
 status TEXT NOT NULL CHECK (status IN ('Draft','PendingActivation','Active','Suspended','Closed')),
 masterAdminUserId TEXT NOT NULL REFERENCES users(id),
 masterAdminRole TEXT NOT NULL DEFAULT 'MasterAdmin' CHECK (masterAdminRole = 'MasterAdmin'),
 staffLimit INTEGER CHECK (staffLimit IS NULL OR (typeof(staffLimit) = 'integer' AND staffLimit >= 1)),
 clientLimit INTEGER CHECK (clientLimit IS NULL OR (typeof(clientLimit) = 'integer' AND clientLimit >= 0)),
 version INTEGER NOT NULL DEFAULT 1 CHECK (version >= 1),
 createdAt INTEGER NOT NULL,
 FOREIGN KEY (id,masterAdminUserId,masterAdminRole)
   REFERENCES platform_memberships(organisationId,userId,role) DEFERRABLE INITIALLY DEFERRED
);
CREATE TABLE platform_memberships (
 organisationId TEXT NOT NULL REFERENCES platform_organisations(id),
 userId TEXT NOT NULL REFERENCES users(id),
 role TEXT NOT NULL CHECK (role IN ('MasterAdmin','Administrator','Staff','Client')),
 status TEXT NOT NULL CHECK (status IN ('Invited','Active','Inactive')),
 createdAt INTEGER NOT NULL,
 PRIMARY KEY (organisationId,userId),
 UNIQUE (organisationId,userId,role)
);
CREATE UNIQUE INDEX platform_one_master_admin ON platform_memberships(organisationId) WHERE role = 'MasterAdmin';
CREATE INDEX platform_memberships_user ON platform_memberships(userId,organisationId);
CREATE TABLE platform_app_licences (
 organisationId TEXT NOT NULL REFERENCES platform_organisations(id),
 appId TEXT NOT NULL,
 status TEXT NOT NULL CHECK (status IN ('Scheduled','Trial','Active','Suspended','Expired','Revoked')),
 startsAt TEXT NOT NULL,
 endsAt TEXT,
 readOnlyUntil TEXT,
 staffLimit INTEGER CHECK (staffLimit IS NULL OR (typeof(staffLimit) = 'integer' AND staffLimit >= 0)),
 clientLimit INTEGER CHECK (clientLimit IS NULL OR (typeof(clientLimit) = 'integer' AND clientLimit >= 0)),
 version INTEGER NOT NULL DEFAULT 1 CHECK (version >= 1),
 PRIMARY KEY (organisationId,appId)
);
CREATE TABLE platform_app_assignments (
 organisationId TEXT NOT NULL,
 userId TEXT NOT NULL,
 appId TEXT NOT NULL,
 role TEXT NOT NULL,
 status TEXT NOT NULL CHECK (status IN ('Active','Inactive')),
 PRIMARY KEY (organisationId,userId,appId),
 FOREIGN KEY (organisationId,userId) REFERENCES platform_memberships(organisationId,userId),
 FOREIGN KEY (organisationId,appId) REFERENCES platform_app_licences(organisationId,appId)
);
CREATE TABLE platform_organisation_invitations (
 id TEXT PRIMARY KEY,
 organisationId TEXT NOT NULL,
 userId TEXT NOT NULL,
 email TEXT NOT NULL,
 tokenHash TEXT NOT NULL UNIQUE CHECK (length(tokenHash) = 64),
 expiresAt INTEGER NOT NULL,
 consumedAt INTEGER,
 revokedAt INTEGER,
 createdAt INTEGER NOT NULL,
 FOREIGN KEY (organisationId,userId) REFERENCES platform_memberships(organisationId,userId),
 CHECK (expiresAt > createdAt),
 CHECK (consumedAt IS NULL OR revokedAt IS NULL)
);
CREATE UNIQUE INDEX platform_one_open_invitation ON platform_organisation_invitations(organisationId,userId)
 WHERE consumedAt IS NULL AND revokedAt IS NULL;
CREATE TABLE platform_organisation_audit (
 id INTEGER PRIMARY KEY AUTOINCREMENT,
 organisationId TEXT REFERENCES platform_organisations(id),
 actorUserId TEXT NOT NULL REFERENCES users(id),
 action TEXT NOT NULL,
 at INTEGER NOT NULL,
 details TEXT NOT NULL CHECK (json_valid(details))
);

INSERT INTO platform_organisation_migrations VALUES('platform-organisations-001','3c740a0ec4291af93dc04eb9a34c81d401928aa0274772b2b6f65040c45fbee8');
-- Ownership mapping only. Existing Chambers readers/writers are not tenant-scoped.
CREATE TABLE platform_legacy_workspaces (
 appId TEXT PRIMARY KEY CHECK (appId = 'advocate'),
 organisationId TEXT NOT NULL UNIQUE REFERENCES platform_organisations(id),
 mappedAt INTEGER NOT NULL,
 snapshotHash TEXT NOT NULL CHECK (length(snapshotHash) = 64),
 UNIQUE (appId,organisationId)
);
CREATE TABLE chambers_record_ownership (
 kind TEXT NOT NULL,
 recordId TEXT NOT NULL,
 organisationId TEXT NOT NULL REFERENCES platform_organisations(id),
 PRIMARY KEY (kind,recordId),
 FOREIGN KEY (kind,recordId) REFERENCES records(kind,id)
);
CREATE INDEX chambers_records_org ON chambers_record_ownership(organisationId,kind);
CREATE TABLE chambers_file_ownership (
 fileId TEXT PRIMARY KEY REFERENCES files(id),
 organisationId TEXT NOT NULL REFERENCES platform_organisations(id)
);
CREATE INDEX chambers_files_org ON chambers_file_ownership(organisationId);

INSERT INTO platform_organisation_migrations VALUES('platform-organisations-002','9e1590f5e358f9101059cc00ec0f28ebd6f47096213729bec85e4b67a31c3cb4');
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

INSERT INTO platform_organisation_migrations VALUES('platform-organisations-003','22f6c8a08be6605eb644d820007c5e4adf6854db6faadb0527899af825d945b5');
-- Only identities explicitly created for invitation onboarding may be activated
-- by an invitation. Existing disabled accounts are never eligible.
CREATE TABLE platform_pending_identities (
  userId TEXT PRIMARY KEY REFERENCES users(id),
  createdAt INTEGER NOT NULL,
  activatedAt INTEGER
);

INSERT INTO platform_organisation_migrations VALUES('platform-organisations-004','59149bffdadf9941487a15209acf9dbf44363e0cdf98677fc6c29dac41cdd7f1');
-- Explicit access links; never inferred from client names or email addresses.
CREATE UNIQUE INDEX chambers_owner_scope ON chambers_record_ownership(organisationId,kind,recordId);
CREATE TABLE chambers_client_access (
 organisationId TEXT NOT NULL,
 userId TEXT NOT NULL,
 kind TEXT NOT NULL DEFAULT 'clients' CHECK(kind='clients'),
 clientId TEXT NOT NULL,
 status TEXT NOT NULL CHECK(status IN ('Active','Revoked')),
 createdAt INTEGER NOT NULL,
 updatedAt INTEGER NOT NULL,
 PRIMARY KEY(organisationId,userId,clientId),
 FOREIGN KEY(organisationId,userId) REFERENCES platform_memberships(organisationId,userId),
 FOREIGN KEY(organisationId,kind,clientId) REFERENCES chambers_record_ownership(organisationId,kind,recordId) ON DELETE CASCADE
);

INSERT INTO platform_organisation_migrations VALUES('platform-organisations-005','46d4e45b2e919830732df1b75f06632f01a6d653197ff214bc47c0dc5d32e733');
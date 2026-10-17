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

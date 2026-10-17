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

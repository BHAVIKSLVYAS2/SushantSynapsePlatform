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

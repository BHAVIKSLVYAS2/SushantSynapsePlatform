CREATE TABLE edge_samaj_blobs (
 id TEXT PRIMARY KEY,
 file_id TEXT REFERENCES samaj_files(id) ON DELETE CASCADE DEFERRABLE INITIALLY DEFERRED,
 attachment_id TEXT REFERENCES samaj_message_attachments(id) ON DELETE CASCADE DEFERRABLE INITIALLY DEFERRED,
 name TEXT NOT NULL CHECK(length(name) BETWEEN 1 AND 200),
 mime TEXT NOT NULL,
 size INTEGER NOT NULL CHECK(size BETWEEN 1 AND 1000000),
 sha256 TEXT NOT NULL CHECK(length(sha256)=64),
 content BLOB NOT NULL CHECK(typeof(content)='blob' AND length(content)=size),
 created_at TEXT NOT NULL,
 CHECK((file_id IS NOT NULL AND file_id=id AND attachment_id IS NULL) OR
       (attachment_id IS NOT NULL AND attachment_id=id AND file_id IS NULL))
);
DROP TRIGGER d1_documents_capacity_insert;
DROP TRIGGER d1_documents_capacity_update;
CREATE TRIGGER d1_documents_capacity_insert BEFORE INSERT ON edge_document_blobs
WHEN (SELECT COALESCE(SUM(size),0) FROM edge_document_blobs WHERE id<>NEW.id)+(SELECT COALESCE(SUM(size),0) FROM edge_samaj_blobs)+NEW.size>100000000
BEGIN SELECT RAISE(ABORT,'free_document_capacity'); END;
CREATE TRIGGER d1_documents_capacity_update BEFORE UPDATE ON edge_document_blobs
WHEN (SELECT COALESCE(SUM(size),0) FROM edge_document_blobs WHERE id<>OLD.id)+(SELECT COALESCE(SUM(size),0) FROM edge_samaj_blobs)+NEW.size>100000000
BEGIN SELECT RAISE(ABORT,'free_document_capacity'); END;
CREATE TRIGGER d1_samaj_capacity_insert BEFORE INSERT ON edge_samaj_blobs
WHEN (SELECT COALESCE(SUM(size),0) FROM edge_samaj_blobs WHERE id<>NEW.id)+(SELECT COALESCE(SUM(size),0) FROM edge_document_blobs)+NEW.size>100000000
BEGIN SELECT RAISE(ABORT,'free_document_capacity'); END;
CREATE TRIGGER d1_samaj_capacity_update BEFORE UPDATE ON edge_samaj_blobs
WHEN (SELECT COALESCE(SUM(size),0) FROM edge_samaj_blobs WHERE id<>OLD.id)+(SELECT COALESCE(SUM(size),0) FROM edge_document_blobs)+NEW.size>100000000
BEGIN SELECT RAISE(ABORT,'free_document_capacity'); END;

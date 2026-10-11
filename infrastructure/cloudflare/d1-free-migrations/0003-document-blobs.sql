CREATE TABLE edge_document_blobs (
 id TEXT PRIMARY KEY REFERENCES files(id) DEFERRABLE INITIALLY DEFERRED,
 name TEXT NOT NULL CHECK(length(name) BETWEEN 1 AND 200),
 mime TEXT NOT NULL,
 size INTEGER NOT NULL CHECK(size BETWEEN 1 AND 1000000),
 sha256 TEXT NOT NULL CHECK(length(sha256)=64),
 content BLOB NOT NULL CHECK(typeof(content)='blob' AND length(content)=size),
 created_at TEXT NOT NULL
);
CREATE TRIGGER d1_documents_capacity_insert BEFORE INSERT ON edge_document_blobs
WHEN (SELECT COALESCE(SUM(size),0) FROM edge_document_blobs WHERE id<>NEW.id)+NEW.size>100000000
BEGIN SELECT RAISE(ABORT,'free_document_capacity'); END;
CREATE TRIGGER d1_documents_capacity_update BEFORE UPDATE ON edge_document_blobs
WHEN (SELECT COALESCE(SUM(size),0) FROM edge_document_blobs WHERE id<>OLD.id)+NEW.size>100000000
BEGIN SELECT RAISE(ABORT,'free_document_capacity'); END;

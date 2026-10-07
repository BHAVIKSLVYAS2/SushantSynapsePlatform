CREATE TABLE IF NOT EXISTS samaj_migrations (version INTEGER PRIMARY KEY);
CREATE TABLE IF NOT EXISTS samaj_communities (id TEXT PRIMARY KEY, name TEXT NOT NULL, created_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS samaj_roles (id TEXT PRIMARY KEY);
CREATE TABLE IF NOT EXISTS samaj_permissions (id TEXT PRIMARY KEY);
CREATE TABLE IF NOT EXISTS samaj_role_permissions (
 role_id TEXT NOT NULL REFERENCES samaj_roles(id), permission TEXT NOT NULL REFERENCES samaj_permissions(id), PRIMARY KEY(role_id,permission)
);
CREATE TABLE IF NOT EXISTS samaj_grants (
 id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id), samaj_id TEXT NOT NULL REFERENCES samaj_communities(id),
 role_id TEXT NOT NULL REFERENCES samaj_roles(id), scope TEXT NOT NULL CHECK(scope IN ('ALL','STATE','DISTRICT','VILLAGE','FAMILY','SELF')),
 scope_value TEXT NOT NULL, created_at TEXT NOT NULL,
 UNIQUE(user_id,samaj_id,role_id,scope,scope_value)
);
CREATE TABLE IF NOT EXISTS samaj_persons (
 id TEXT PRIMARY KEY, samaj_id TEXT NOT NULL REFERENCES samaj_communities(id), code TEXT NOT NULL UNIQUE,
 status TEXT NOT NULL CHECK(status IN ('DRAFT','SUBMITTED','UNDER_REVIEW','CORRECTION_REQUIRED','VERIFIED','REJECTED','ARCHIVED')),
 revision INTEGER NOT NULL DEFAULT 1, data TEXT NOT NULL CHECK(json_valid(data)), privacy TEXT NOT NULL CHECK(json_valid(privacy)),
 created_by TEXT NOT NULL REFERENCES users(id), created_at TEXT NOT NULL, updated_at TEXT NOT NULL, merged_into TEXT REFERENCES samaj_persons(id) DEFERRABLE INITIALLY DEFERRED
);
CREATE TABLE IF NOT EXISTS samaj_families (
 id TEXT PRIMARY KEY, samaj_id TEXT NOT NULL REFERENCES samaj_communities(id), code TEXT NOT NULL UNIQUE,
 head_id TEXT REFERENCES samaj_persons(id), status TEXT NOT NULL CHECK(status IN ('DRAFT','SUBMITTED','UNDER_REVIEW','CORRECTION_REQUIRED','VERIFIED','REJECTED','ARCHIVED')),
 revision INTEGER NOT NULL DEFAULT 1, data TEXT NOT NULL CHECK(json_valid(data)), privacy TEXT NOT NULL CHECK(json_valid(privacy)),
 created_by TEXT NOT NULL REFERENCES users(id), created_at TEXT NOT NULL, updated_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS samaj_memberships (
 id TEXT PRIMARY KEY, person_id TEXT NOT NULL REFERENCES samaj_persons(id), family_id TEXT NOT NULL REFERENCES samaj_families(id),
 type TEXT NOT NULL CHECK(type IN ('BirthFamily','MaritalFamily','GuardianFamily','Other')), is_primary INTEGER NOT NULL CHECK(is_primary IN (0,1)), start_date TEXT NOT NULL DEFAULT '', end_date TEXT NOT NULL DEFAULT '',
 UNIQUE(person_id,family_id,type)
);
CREATE UNIQUE INDEX IF NOT EXISTS samaj_primary_family ON samaj_memberships(person_id) WHERE is_primary=1 AND end_date='';
CREATE TABLE IF NOT EXISTS samaj_relationships (
 id TEXT PRIMARY KEY, person_id TEXT NOT NULL REFERENCES samaj_persons(id), related_id TEXT NOT NULL REFERENCES samaj_persons(id),
 type TEXT NOT NULL CHECK(type IN ('Father','Mother','Parent','Spouse','Sibling','Guardian','Other')),
 status TEXT NOT NULL DEFAULT 'SUBMITTED', end_date TEXT NOT NULL DEFAULT '', created_by TEXT NOT NULL REFERENCES users(id),
 CHECK(person_id<>related_id), UNIQUE(person_id,related_id,type)
);
CREATE TABLE IF NOT EXISTS samaj_user_person (
 user_id TEXT NOT NULL REFERENCES users(id), samaj_id TEXT NOT NULL REFERENCES samaj_communities(id), person_id TEXT NOT NULL UNIQUE REFERENCES samaj_persons(id), PRIMARY KEY(user_id,samaj_id)
);
CREATE TABLE IF NOT EXISTS samaj_reviews (
 id TEXT PRIMARY KEY, samaj_id TEXT NOT NULL REFERENCES samaj_communities(id), kind TEXT NOT NULL,
 entity_id TEXT NOT NULL, requested_by TEXT NOT NULL REFERENCES users(id), status TEXT NOT NULL DEFAULT 'PENDING',
 old_value TEXT NOT NULL CHECK(json_valid(old_value)), new_value TEXT NOT NULL CHECK(json_valid(new_value)),
 created_at TEXT NOT NULL, reviewed_by TEXT REFERENCES users(id), reviewed_at TEXT, reason TEXT NOT NULL DEFAULT ''
);
CREATE UNIQUE INDEX IF NOT EXISTS samaj_pending_review ON samaj_reviews(kind,entity_id,coalesce(json_extract(new_value,'$.familyId'),''),coalesce(json_extract(new_value,'$.relatedId'),''),coalesce(json_extract(new_value,'$.type'),'')) WHERE status='PENDING';
CREATE TABLE IF NOT EXISTS samaj_audit (
 id TEXT PRIMARY KEY, samaj_id TEXT NOT NULL REFERENCES samaj_communities(id), actor TEXT NOT NULL REFERENCES users(id), action TEXT NOT NULL,
 entity_id TEXT NOT NULL, old_value TEXT NOT NULL CHECK(json_valid(old_value)), new_value TEXT NOT NULL CHECK(json_valid(new_value)), at TEXT NOT NULL
);
CREATE TRIGGER IF NOT EXISTS samaj_audit_no_update BEFORE UPDATE ON samaj_audit BEGIN SELECT RAISE(ABORT,'Audit is append only'); END;
CREATE TRIGGER IF NOT EXISTS samaj_audit_no_delete BEFORE DELETE ON samaj_audit BEGIN SELECT RAISE(ABORT,'Audit is append only'); END;
CREATE TABLE IF NOT EXISTS samaj_consent (
 id TEXT PRIMARY KEY, family_id TEXT NOT NULL REFERENCES samaj_families(id), user_id TEXT NOT NULL REFERENCES users(id), version TEXT NOT NULL, given_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS samaj_files (
 id TEXT PRIMARY KEY, samaj_id TEXT NOT NULL REFERENCES samaj_communities(id), person_id TEXT REFERENCES samaj_persons(id), family_id TEXT REFERENCES samaj_families(id),
 name TEXT NOT NULL, mime TEXT NOT NULL, content BLOB NOT NULL, created_by TEXT NOT NULL REFERENCES users(id), created_at TEXT NOT NULL,
 CHECK((person_id IS NULL)<>(family_id IS NULL))
);
CREATE INDEX IF NOT EXISTS samaj_person_community ON samaj_persons(samaj_id,status);
CREATE INDEX IF NOT EXISTS samaj_family_community ON samaj_families(samaj_id,status);
CREATE INDEX IF NOT EXISTS samaj_membership_family ON samaj_memberships(family_id);
CREATE INDEX IF NOT EXISTS samaj_relationship_related ON samaj_relationships(related_id);
CREATE INDEX IF NOT EXISTS samaj_grant_user ON samaj_grants(user_id,samaj_id);
CREATE INDEX IF NOT EXISTS samaj_review_queue ON samaj_reviews(samaj_id,status);

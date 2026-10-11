-- platform: schema.sql
-- Shared identity, app access, preferences and audit tables.
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    role TEXT NOT NULL CHECK (role IN ('Owner', 'Advocate', 'Clerk')),
    password TEXT NOT NULL,
    active INTEGER NOT NULL DEFAULT 1 CHECK (active IN (0, 1))
);

CREATE TABLE IF NOT EXISTS sessions (
    token TEXT PRIMARY KEY,
    userId TEXT NOT NULL REFERENCES users(id),
    expires INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS audit (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    at TEXT NOT NULL,
    actor TEXT NOT NULL,
    action TEXT NOT NULL,
    kind TEXT NOT NULL,
    recordId TEXT NOT NULL,
    label TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS settings (
    id TEXT PRIMARY KEY,
    data TEXT NOT NULL CHECK (json_valid(data))
);

CREATE INDEX IF NOT EXISTS sessions_expiry ON sessions(expires);

CREATE INDEX IF NOT EXISTS sessions_user ON sessions(userId);

CREATE TABLE IF NOT EXISTS app_access (
    userId TEXT NOT NULL REFERENCES users(id),
    appId TEXT NOT NULL,
    PRIMARY KEY (userId, appId)
);

CREATE TABLE IF NOT EXISTS platform_preferences (
    userId TEXT PRIMARY KEY REFERENCES users(id),
    data TEXT NOT NULL CHECK (json_valid(data))
);

-- chambers: schema.sql
-- Chambers-owned business tables and reporting views. Preserve names for existing databases.
CREATE TABLE IF NOT EXISTS records (
    kind TEXT NOT NULL,
    id TEXT NOT NULL,
    data TEXT NOT NULL CHECK (json_valid(data)),
    PRIMARY KEY (kind, id)
);

CREATE TABLE IF NOT EXISTS files (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    mime TEXT NOT NULL,
    content BLOB
);

CREATE INDEX IF NOT EXISTS records_case ON records(kind, json_extract(data, '$.caseId'));

CREATE INDEX IF NOT EXISTS records_client ON records(kind, json_extract(data, '$.clientId'));

CREATE INDEX IF NOT EXISTS records_invoice ON records(kind, json_extract(data, '$.invoiceId'));

CREATE VIEW IF NOT EXISTS clients AS
SELECT id, json_extract(data, '$.name') AS name,
       json_extract(data, '$.email') AS email,
       json_extract(data, '$.phone') AS phone,
       json_extract(data, '$.archived') AS archived, data
FROM records WHERE kind = 'clients';

CREATE VIEW IF NOT EXISTS cases AS
SELECT id, json_extract(data, '$.title') AS title,
       json_extract(data, '$.clientId') AS client_id,
       json_extract(data, '$.number') AS case_number,
       json_extract(data, '$.cnr') AS cnr,
       json_extract(data, '$.court') AS court,
       json_extract(data, '$.status') AS status,
       json_extract(data, '$.archived') AS archived, data
FROM records WHERE kind = 'cases';

CREATE VIEW IF NOT EXISTS hearings AS
SELECT id, json_extract(data, '$.caseId') AS case_id,
       json_extract(data, '$.date') AS hearing_date,
       json_extract(data, '$.time') AS hearing_time,
       json_extract(data, '$.status') AS status,
       json_extract(data, '$.archived') AS archived, data
FROM records WHERE kind = 'hearings';

CREATE VIEW IF NOT EXISTS invoices AS
SELECT id, json_extract(data, '$.number') AS invoice_number,
       json_extract(data, '$.clientId') AS client_id,
       json_extract(data, '$.caseId') AS case_id,
       json_extract(data, '$.amount') AS amount,
       json_extract(data, '$.date') AS issue_date,
       json_extract(data, '$.due') AS due_date,
       json_extract(data, '$.archived') AS archived, data
FROM records WHERE kind = 'invoices';

CREATE VIEW IF NOT EXISTS payments AS
SELECT id, json_extract(data, '$.invoiceId') AS invoice_id,
       json_extract(data, '$.amount') AS amount,
       json_extract(data, '$.date') AS payment_date,
       json_extract(data, '$.archived') AS archived, data
FROM records WHERE kind = 'payments';

CREATE VIEW IF NOT EXISTS invoice_balances AS
SELECT i.id, i.invoice_number, i.client_id, i.amount,
       COALESCE(ROUND(SUM(p.amount), 2), 0) AS paid,
       ROUND(i.amount - COALESCE(SUM(p.amount), 0), 2) AS balance
FROM invoices i
LEFT JOIN payments p ON p.invoice_id = i.id AND p.archived = 0
WHERE i.archived = 0
GROUP BY i.id;

-- batchfee: 001-initial.sql
CREATE TABLE IF NOT EXISTS batchfee_migrations (version INTEGER PRIMARY KEY);
CREATE TABLE IF NOT EXISTS batchfee_workspace (
 id INTEGER PRIMARY KEY CHECK(id=1), revision INTEGER NOT NULL DEFAULT 0,
 data TEXT NOT NULL CHECK(json_valid(data))
);
CREATE TABLE IF NOT EXISTS batchfee_events (
 id INTEGER PRIMARY KEY AUTOINCREMENT, at TEXT NOT NULL, actor TEXT NOT NULL,
 action TEXT NOT NULL, data TEXT NOT NULL CHECK(json_valid(data))
);

-- batchfee: 002-staff.sql
CREATE TABLE IF NOT EXISTS batchfee_staff (user_id TEXT PRIMARY KEY REFERENCES users(id), role TEXT NOT NULL CHECK(role IN ('Viewer','Collector','Manager')));

-- samaj: 001-initial.sql
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
 name TEXT NOT NULL, mime TEXT NOT NULL, content BLOB, created_by TEXT NOT NULL REFERENCES users(id), created_at TEXT NOT NULL,
 CHECK((person_id IS NULL)<>(family_id IS NULL))
);
CREATE INDEX IF NOT EXISTS samaj_person_community ON samaj_persons(samaj_id,status);
CREATE INDEX IF NOT EXISTS samaj_family_community ON samaj_families(samaj_id,status);
CREATE INDEX IF NOT EXISTS samaj_membership_family ON samaj_memberships(family_id);
CREATE INDEX IF NOT EXISTS samaj_relationship_related ON samaj_relationships(related_id);
CREATE INDEX IF NOT EXISTS samaj_grant_user ON samaj_grants(user_id,samaj_id);
CREATE INDEX IF NOT EXISTS samaj_review_queue ON samaj_reviews(samaj_id,status);

-- samaj: 002-workflows.sql
CREATE TABLE IF NOT EXISTS samaj_drafts (
 id TEXT PRIMARY KEY, samaj_id TEXT NOT NULL REFERENCES samaj_communities(id), user_id TEXT NOT NULL REFERENCES users(id), revision INTEGER NOT NULL DEFAULT 1,
 step INTEGER NOT NULL DEFAULT 0 CHECK(step BETWEEN 0 AND 9), data TEXT NOT NULL CHECK(json_valid(data)), submitted_family_id TEXT REFERENCES samaj_families(id), updated_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS samaj_duplicate_decisions (
 person_id TEXT NOT NULL REFERENCES samaj_persons(id), related_id TEXT NOT NULL REFERENCES samaj_persons(id), decision TEXT NOT NULL CHECK(decision IN ('IGNORE','MERGE')), actor TEXT NOT NULL REFERENCES users(id), at TEXT NOT NULL, PRIMARY KEY(person_id,related_id)
);
CREATE TABLE IF NOT EXISTS samaj_import_jobs (
 id TEXT PRIMARY KEY, samaj_id TEXT NOT NULL REFERENCES samaj_communities(id), created_by TEXT NOT NULL REFERENCES users(id), status TEXT NOT NULL, data TEXT NOT NULL CHECK(json_valid(data)), created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS samaj_message_preferences (
 user_id TEXT NOT NULL REFERENCES users(id), samaj_id TEXT NOT NULL REFERENCES samaj_communities(id), visibility TEXT NOT NULL CHECK(visibility IN ('Nobody','FamilyOnly','VerifiedMembers','Connections','SamajMembers')), PRIMARY KEY(user_id,samaj_id)
);
CREATE TABLE IF NOT EXISTS samaj_blocks (user_id TEXT NOT NULL REFERENCES users(id), blocked_id TEXT NOT NULL REFERENCES users(id), PRIMARY KEY(user_id,blocked_id), CHECK(user_id<>blocked_id));
CREATE TABLE IF NOT EXISTS samaj_conversations (
 id TEXT PRIMARY KEY, samaj_id TEXT NOT NULL REFERENCES samaj_communities(id), sender TEXT NOT NULL REFERENCES users(id), receiver TEXT NOT NULL REFERENCES users(id),
 reason TEXT NOT NULL, status TEXT NOT NULL CHECK(status IN ('PENDING','ACCEPTED','DECLINED')), created_at TEXT NOT NULL, CHECK(sender<>receiver)
);
CREATE UNIQUE INDEX IF NOT EXISTS samaj_open_conversation ON samaj_conversations(samaj_id,min(sender,receiver),max(sender,receiver)) WHERE status IN ('PENDING','ACCEPTED');
CREATE TABLE IF NOT EXISTS samaj_participants (
 conversation_id TEXT NOT NULL REFERENCES samaj_conversations(id), user_id TEXT NOT NULL REFERENCES users(id), read_at TEXT NOT NULL DEFAULT '', muted INTEGER NOT NULL DEFAULT 0 CHECK(muted IN (0,1)), PRIMARY KEY(conversation_id,user_id)
);
CREATE TABLE IF NOT EXISTS samaj_messages (
 id TEXT PRIMARY KEY, conversation_id TEXT NOT NULL REFERENCES samaj_conversations(id), sender TEXT NOT NULL REFERENCES users(id), body TEXT NOT NULL, created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS samaj_message_attachments (
 id TEXT PRIMARY KEY, message_id TEXT NOT NULL REFERENCES samaj_messages(id), name TEXT NOT NULL, mime TEXT NOT NULL, content BLOB
);
CREATE TABLE IF NOT EXISTS samaj_message_reports (
 id TEXT PRIMARY KEY, message_id TEXT NOT NULL REFERENCES samaj_messages(id), reporter TEXT NOT NULL REFERENCES users(id), reason TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'OPEN', created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS samaj_announcements (
 id TEXT PRIMARY KEY, samaj_id TEXT NOT NULL REFERENCES samaj_communities(id), title TEXT NOT NULL, body TEXT NOT NULL, actor TEXT NOT NULL REFERENCES users(id), created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS samaj_message_thread ON samaj_messages(conversation_id,created_at);
CREATE INDEX IF NOT EXISTS samaj_conversations_receiver ON samaj_conversations(receiver,samaj_id);
CREATE INDEX IF NOT EXISTS samaj_draft_owner ON samaj_drafts(user_id,samaj_id);

-- samaj: 003-events.sql
CREATE TABLE IF NOT EXISTS samaj_events (id TEXT PRIMARY KEY,samaj_id TEXT NOT NULL REFERENCES samaj_communities(id),title TEXT NOT NULL,starts_at TEXT NOT NULL,location TEXT NOT NULL,description TEXT NOT NULL,family_id TEXT REFERENCES samaj_families(id),created_by TEXT NOT NULL REFERENCES users(id),cancelled INTEGER NOT NULL DEFAULT 0);
CREATE INDEX IF NOT EXISTS samaj_events_calendar ON samaj_events(samaj_id,starts_at);
CREATE TABLE IF NOT EXISTS samaj_event_rsvps (event_id TEXT NOT NULL REFERENCES samaj_events(id),user_id TEXT NOT NULL REFERENCES users(id),response TEXT NOT NULL CHECK(response IN ('Going','Maybe','Not going')),PRIMARY KEY(event_id,user_id));

-- tournament: 001-initial.sql
CREATE TABLE IF NOT EXISTS tournament_lite_events (id TEXT PRIMARY KEY, owner TEXT NOT NULL, revision INTEGER NOT NULL, public_token TEXT NOT NULL UNIQUE, data TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS tournament_lite_migrations (version INTEGER PRIMARY KEY);

-- news: 001-editions.sql
-- Additive News schema. Never replace existing platform or Chambers tables.
CREATE TABLE IF NOT EXISTS news_migrations(version INTEGER PRIMARY KEY, appliedAt TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS news_editions(
 date TEXT PRIMARY KEY, name TEXT NOT NULL, author TEXT NOT NULL,
 cutoff TEXT NOT NULL, publishedAt TEXT NOT NULL,
 satireTitle TEXT NOT NULL, satireBody TEXT NOT NULL,
 satireStory INTEGER NOT NULL CHECK(satireStory BETWEEN 1 AND 10),
 model TEXT NOT NULL, promptVersion TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS news_stories(
 editionDate TEXT NOT NULL REFERENCES news_editions(date),
 position INTEGER NOT NULL CHECK(position BETWEEN 1 AND 10),
 title TEXT NOT NULL, brief TEXT NOT NULL, source TEXT NOT NULL,
 url TEXT NOT NULL, publishedAt TEXT NOT NULL,
 PRIMARY KEY(editionDate,position), UNIQUE(editionDate,url)
);
CREATE TABLE IF NOT EXISTS news_runs(
 date TEXT PRIMARY KEY, cutoff TEXT NOT NULL,
 state TEXT NOT NULL CHECK(state IN ('pending','running','failed','published')),
 sourceJson TEXT NOT NULL DEFAULT '[]', attempts INTEGER NOT NULL DEFAULT 0,
 leaseToken TEXT, leaseUntil TEXT, error TEXT,
 createdAt TEXT NOT NULL, updatedAt TEXT NOT NULL
);

-- news: 002-fetch-budget.sql
CREATE TABLE IF NOT EXISTS news_fetch_budget(
 day TEXT PRIMARY KEY, requests INTEGER NOT NULL DEFAULT 0 CHECK(requests >= 0)
);

-- fundlens: 001-portfolio.sql
-- Additive app migration; existing identity and Chambers tables are untouched.
CREATE TABLE IF NOT EXISTS fund_lens_migrations (version INTEGER PRIMARY KEY, appliedAt TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS fund_lens_portfolios (userId TEXT PRIMARY KEY REFERENCES users(id), revision INTEGER NOT NULL DEFAULT 0);
CREATE TABLE IF NOT EXISTS fund_lens_transactions (
 id TEXT PRIMARY KEY, userId TEXT NOT NULL REFERENCES users(id),
 schemeCode TEXT NOT NULL, schemeName TEXT NOT NULL, date TEXT NOT NULL,
 type TEXT NOT NULL CHECK(type IN ('BUY','SELL','DIVIDEND')),
 units REAL NOT NULL CHECK(units >= 0), amount REAL NOT NULL CHECK(amount > 0),
 reference TEXT NOT NULL DEFAULT '', fingerprint TEXT NOT NULL,
 UNIQUE(userId,fingerprint)
);
CREATE INDEX IF NOT EXISTS fund_lens_transactions_user_date ON fund_lens_transactions(userId,date);

-- satire: 001-arena.sql
-- Dedicated cloud SQLite storage. Never applied to chambers.sqlite.
CREATE TABLE IF NOT EXISTS arena_votes (
 voter TEXT NOT NULL,
 character TEXT NOT NULL CHECK(character IN ('namo-nimbus','rally-rohan','muffler-mohan')),
 round TEXT NOT NULL,
 reaction TEXT NOT NULL CHECK(reaction IN ('garland','shoe','finger')),
 updated_at TEXT NOT NULL,
 PRIMARY KEY(voter,character,round)
);
CREATE INDEX IF NOT EXISTS arena_round_counts ON arena_votes(round,character,reaction);

-- satire: 002-expanded-arena.sql
-- Additive migration: preserves the original table and every existing ballot.
CREATE TABLE IF NOT EXISTS arena_expanded_votes (
 voter TEXT NOT NULL,
 character TEXT NOT NULL CHECK(character IN ('namo-nimbus','rally-rohan','muffler-mohan','briefcase-babu','drumroll-didi','coalition-chacha')),
 round TEXT NOT NULL,
 reaction TEXT NOT NULL CHECK(reaction IN ('garland','shoe','finger','applause','tomato','laugh')),
 updated_at TEXT NOT NULL,
 PRIMARY KEY(voter,character,round)
);
CREATE INDEX IF NOT EXISTS arena_expanded_counts ON arena_expanded_votes(round,character,reaction);
CREATE VIEW IF NOT EXISTS arena_all_votes AS
 SELECT voter,character,round,reaction,updated_at FROM (
 SELECT *,ROW_NUMBER() OVER(PARTITION BY voter,character,round ORDER BY updated_at DESC,source DESC) AS position FROM (
 SELECT voter,character,round,reaction,updated_at,0 AS source FROM arena_votes
 UNION ALL SELECT voter,character,round,reaction,updated_at,1 AS source FROM arena_expanded_votes
 )) WHERE position=1;

-- satire: 003-nine-character-arena.sql
-- Additive: retain both earlier ballot tables and their records.
CREATE TABLE IF NOT EXISTS arena_cast_votes (
 voter TEXT NOT NULL,
 character TEXT NOT NULL CHECK(character IN ('namo-nimbus','rally-rohan','muffler-mohan','briefcase-babu','drumroll-didi','coalition-chacha','saffron-sage','cycle-captain','lexicon-lord')),
 round TEXT NOT NULL,
 reaction TEXT NOT NULL CHECK(reaction IN ('garland','shoe','finger','applause','tomato','laugh')),
 updated_at TEXT NOT NULL,
 PRIMARY KEY(voter,character,round)
);
CREATE INDEX IF NOT EXISTS arena_cast_counts ON arena_cast_votes(round,character,reaction);
DROP VIEW IF EXISTS arena_all_votes;
CREATE VIEW arena_all_votes AS
 SELECT voter,character,round,reaction,updated_at FROM (
 SELECT *,ROW_NUMBER() OVER(PARTITION BY voter,character,round ORDER BY updated_at DESC,source DESC) AS position FROM (
 SELECT voter,character,round,reaction,updated_at,0 AS source FROM arena_votes
 UNION ALL SELECT voter,character,round,reaction,updated_at,1 AS source FROM arena_expanded_votes
 UNION ALL SELECT voter,character,round,reaction,updated_at,2 AS source FROM arena_cast_votes
 )) WHERE position=1;

-- satire: 004-highway-budget.sql
-- Additive character expansion: previous ballots and constraints remain intact.
CREATE TABLE IF NOT EXISTS arena_additions_votes (
 voter TEXT NOT NULL,
 character TEXT NOT NULL CHECK(character IN ('highway-hari','budget-beena')),
 round TEXT NOT NULL,
 reaction TEXT NOT NULL CHECK(reaction IN ('garland','shoe','finger','applause','tomato','laugh')),
 updated_at TEXT NOT NULL,
 PRIMARY KEY(voter,character,round)
);
CREATE INDEX IF NOT EXISTS arena_additions_counts ON arena_additions_votes(round,character,reaction);
DROP VIEW IF EXISTS arena_all_votes;
CREATE VIEW arena_all_votes AS
 SELECT voter,character,round,reaction,updated_at FROM (
 SELECT *,ROW_NUMBER() OVER(PARTITION BY voter,character,round ORDER BY updated_at DESC,source DESC) AS position FROM (
 SELECT voter,character,round,reaction,updated_at,0 AS source FROM arena_votes
 UNION ALL SELECT voter,character,round,reaction,updated_at,1 AS source FROM arena_expanded_votes
 UNION ALL SELECT voter,character,round,reaction,updated_at,2 AS source FROM arena_cast_votes
 UNION ALL SELECT voter,character,round,reaction,updated_at,3 AS source FROM arena_additions_votes
 )) WHERE position=1;

-- satire: 005-speakers.sql
-- Additive character expansion: previous ballots and constraints remain intact.
CREATE TABLE IF NOT EXISTS arena_speakers_votes (
 voter TEXT NOT NULL,
 character TEXT NOT NULL CHECK(character IN ('rally-raja','debate-dastan')),
 round TEXT NOT NULL,
 reaction TEXT NOT NULL CHECK(reaction IN ('garland','shoe','finger','applause','tomato','laugh')),
 updated_at TEXT NOT NULL,
 PRIMARY KEY(voter,character,round)
);
CREATE INDEX IF NOT EXISTS arena_speakers_counts ON arena_speakers_votes(round,character,reaction);
DROP VIEW IF EXISTS arena_all_votes;
CREATE VIEW arena_all_votes AS
 SELECT voter,character,round,reaction,updated_at FROM (
 SELECT *,ROW_NUMBER() OVER(PARTITION BY voter,character,round ORDER BY updated_at DESC,source DESC) AS position FROM (
 SELECT voter,character,round,reaction,updated_at,0 AS source FROM arena_votes
 UNION ALL SELECT voter,character,round,reaction,updated_at,1 AS source FROM arena_expanded_votes
 UNION ALL SELECT voter,character,round,reaction,updated_at,2 AS source FROM arena_cast_votes
 UNION ALL SELECT voter,character,round,reaction,updated_at,3 AS source FROM arena_additions_votes
 UNION ALL SELECT voter,character,round,reaction,updated_at,4 AS source FROM arena_speakers_votes
 )) WHERE position=1;


-- Shared D1 optimistic commit guard. All platform business writes use this guard.
CREATE TABLE IF NOT EXISTS edge_revision(id INTEGER PRIMARY KEY CHECK(id=1),revision INTEGER NOT NULL);
INSERT OR IGNORE INTO edge_revision VALUES(1,0);
CREATE TABLE IF NOT EXISTS edge_write_guard(id TEXT PRIMARY KEY,valid INTEGER NOT NULL CONSTRAINT edge_revision_conflict CHECK(valid=1));
CREATE TABLE IF NOT EXISTS edge_objects(scope TEXT NOT NULL CHECK(scope IN ('chambers','samaj')),id TEXT NOT NULL,object_key TEXT NOT NULL UNIQUE,name TEXT NOT NULL,mime TEXT NOT NULL,size INTEGER NOT NULL,sha256 TEXT NOT NULL,created_at TEXT NOT NULL,PRIMARY KEY(scope,id));
CREATE TABLE IF NOT EXISTS edge_imports(id TEXT PRIMARY KEY,manifest_hash TEXT NOT NULL,completed_at TEXT NOT NULL);

INSERT OR IGNORE INTO samaj_permissions VALUES('family.view');
INSERT OR IGNORE INTO samaj_permissions VALUES('family.create');
INSERT OR IGNORE INTO samaj_permissions VALUES('family.edit');
INSERT OR IGNORE INTO samaj_permissions VALUES('person.view');
INSERT OR IGNORE INTO samaj_permissions VALUES('person.create');
INSERT OR IGNORE INTO samaj_permissions VALUES('person.edit');
INSERT OR IGNORE INTO samaj_permissions VALUES('person.mobile.view');
INSERT OR IGNORE INTO samaj_permissions VALUES('person.address.view');
INSERT OR IGNORE INTO samaj_permissions VALUES('person.dob.view');
INSERT OR IGNORE INTO samaj_permissions VALUES('verification.approve');
INSERT OR IGNORE INTO samaj_permissions VALUES('directory.search');
INSERT OR IGNORE INTO samaj_permissions VALUES('report.view');
INSERT OR IGNORE INTO samaj_permissions VALUES('report.export');
INSERT OR IGNORE INTO samaj_permissions VALUES('admin.manage');
INSERT OR IGNORE INTO samaj_permissions VALUES('chat.use');
INSERT OR IGNORE INTO samaj_permissions VALUES('announcement.create');
INSERT OR IGNORE INTO samaj_roles VALUES('SUPER_ADMIN');
INSERT OR IGNORE INTO samaj_role_permissions VALUES('SUPER_ADMIN','family.view');
INSERT OR IGNORE INTO samaj_role_permissions VALUES('SUPER_ADMIN','family.create');
INSERT OR IGNORE INTO samaj_role_permissions VALUES('SUPER_ADMIN','family.edit');
INSERT OR IGNORE INTO samaj_role_permissions VALUES('SUPER_ADMIN','person.view');
INSERT OR IGNORE INTO samaj_role_permissions VALUES('SUPER_ADMIN','person.create');
INSERT OR IGNORE INTO samaj_role_permissions VALUES('SUPER_ADMIN','person.edit');
INSERT OR IGNORE INTO samaj_role_permissions VALUES('SUPER_ADMIN','person.mobile.view');
INSERT OR IGNORE INTO samaj_role_permissions VALUES('SUPER_ADMIN','person.address.view');
INSERT OR IGNORE INTO samaj_role_permissions VALUES('SUPER_ADMIN','person.dob.view');
INSERT OR IGNORE INTO samaj_role_permissions VALUES('SUPER_ADMIN','verification.approve');
INSERT OR IGNORE INTO samaj_role_permissions VALUES('SUPER_ADMIN','directory.search');
INSERT OR IGNORE INTO samaj_role_permissions VALUES('SUPER_ADMIN','report.view');
INSERT OR IGNORE INTO samaj_role_permissions VALUES('SUPER_ADMIN','report.export');
INSERT OR IGNORE INTO samaj_role_permissions VALUES('SUPER_ADMIN','admin.manage');
INSERT OR IGNORE INTO samaj_role_permissions VALUES('SUPER_ADMIN','chat.use');
INSERT OR IGNORE INTO samaj_role_permissions VALUES('SUPER_ADMIN','announcement.create');
INSERT OR IGNORE INTO samaj_roles VALUES('SAMAJ_ADMIN');
INSERT OR IGNORE INTO samaj_role_permissions VALUES('SAMAJ_ADMIN','family.view');
INSERT OR IGNORE INTO samaj_role_permissions VALUES('SAMAJ_ADMIN','family.create');
INSERT OR IGNORE INTO samaj_role_permissions VALUES('SAMAJ_ADMIN','family.edit');
INSERT OR IGNORE INTO samaj_role_permissions VALUES('SAMAJ_ADMIN','person.view');
INSERT OR IGNORE INTO samaj_role_permissions VALUES('SAMAJ_ADMIN','person.create');
INSERT OR IGNORE INTO samaj_role_permissions VALUES('SAMAJ_ADMIN','person.edit');
INSERT OR IGNORE INTO samaj_role_permissions VALUES('SAMAJ_ADMIN','person.mobile.view');
INSERT OR IGNORE INTO samaj_role_permissions VALUES('SAMAJ_ADMIN','person.address.view');
INSERT OR IGNORE INTO samaj_role_permissions VALUES('SAMAJ_ADMIN','person.dob.view');
INSERT OR IGNORE INTO samaj_role_permissions VALUES('SAMAJ_ADMIN','verification.approve');
INSERT OR IGNORE INTO samaj_role_permissions VALUES('SAMAJ_ADMIN','directory.search');
INSERT OR IGNORE INTO samaj_role_permissions VALUES('SAMAJ_ADMIN','report.view');
INSERT OR IGNORE INTO samaj_role_permissions VALUES('SAMAJ_ADMIN','report.export');
INSERT OR IGNORE INTO samaj_role_permissions VALUES('SAMAJ_ADMIN','admin.manage');
INSERT OR IGNORE INTO samaj_role_permissions VALUES('SAMAJ_ADMIN','chat.use');
INSERT OR IGNORE INTO samaj_role_permissions VALUES('SAMAJ_ADMIN','announcement.create');
INSERT OR IGNORE INTO samaj_roles VALUES('AREA_COORDINATOR');
INSERT OR IGNORE INTO samaj_role_permissions VALUES('AREA_COORDINATOR','family.view');
INSERT OR IGNORE INTO samaj_role_permissions VALUES('AREA_COORDINATOR','family.create');
INSERT OR IGNORE INTO samaj_role_permissions VALUES('AREA_COORDINATOR','family.edit');
INSERT OR IGNORE INTO samaj_role_permissions VALUES('AREA_COORDINATOR','person.view');
INSERT OR IGNORE INTO samaj_role_permissions VALUES('AREA_COORDINATOR','person.create');
INSERT OR IGNORE INTO samaj_role_permissions VALUES('AREA_COORDINATOR','person.edit');
INSERT OR IGNORE INTO samaj_role_permissions VALUES('AREA_COORDINATOR','person.mobile.view');
INSERT OR IGNORE INTO samaj_role_permissions VALUES('AREA_COORDINATOR','person.address.view');
INSERT OR IGNORE INTO samaj_role_permissions VALUES('AREA_COORDINATOR','person.dob.view');
INSERT OR IGNORE INTO samaj_role_permissions VALUES('AREA_COORDINATOR','verification.approve');
INSERT OR IGNORE INTO samaj_role_permissions VALUES('AREA_COORDINATOR','directory.search');
INSERT OR IGNORE INTO samaj_role_permissions VALUES('AREA_COORDINATOR','report.view');
INSERT OR IGNORE INTO samaj_role_permissions VALUES('AREA_COORDINATOR','report.export');
INSERT OR IGNORE INTO samaj_role_permissions VALUES('AREA_COORDINATOR','chat.use');
INSERT OR IGNORE INTO samaj_roles VALUES('FAMILY_ADMIN');
INSERT OR IGNORE INTO samaj_role_permissions VALUES('FAMILY_ADMIN','family.view');
INSERT OR IGNORE INTO samaj_role_permissions VALUES('FAMILY_ADMIN','person.view');
INSERT OR IGNORE INTO samaj_role_permissions VALUES('FAMILY_ADMIN','directory.search');
INSERT OR IGNORE INTO samaj_role_permissions VALUES('FAMILY_ADMIN','person.mobile.view');
INSERT OR IGNORE INTO samaj_role_permissions VALUES('FAMILY_ADMIN','person.address.view');
INSERT OR IGNORE INTO samaj_role_permissions VALUES('FAMILY_ADMIN','person.dob.view');
INSERT OR IGNORE INTO samaj_role_permissions VALUES('FAMILY_ADMIN','family.create');
INSERT OR IGNORE INTO samaj_role_permissions VALUES('FAMILY_ADMIN','family.edit');
INSERT OR IGNORE INTO samaj_role_permissions VALUES('FAMILY_ADMIN','person.create');
INSERT OR IGNORE INTO samaj_role_permissions VALUES('FAMILY_ADMIN','person.edit');
INSERT OR IGNORE INTO samaj_role_permissions VALUES('FAMILY_ADMIN','report.export');
INSERT OR IGNORE INTO samaj_role_permissions VALUES('FAMILY_ADMIN','chat.use');
INSERT OR IGNORE INTO samaj_roles VALUES('FAMILY_MEMBER');
INSERT OR IGNORE INTO samaj_role_permissions VALUES('FAMILY_MEMBER','family.view');
INSERT OR IGNORE INTO samaj_role_permissions VALUES('FAMILY_MEMBER','person.view');
INSERT OR IGNORE INTO samaj_role_permissions VALUES('FAMILY_MEMBER','directory.search');
INSERT OR IGNORE INTO samaj_role_permissions VALUES('FAMILY_MEMBER','person.mobile.view');
INSERT OR IGNORE INTO samaj_role_permissions VALUES('FAMILY_MEMBER','person.address.view');
INSERT OR IGNORE INTO samaj_role_permissions VALUES('FAMILY_MEMBER','person.dob.view');
INSERT OR IGNORE INTO samaj_role_permissions VALUES('FAMILY_MEMBER','person.edit');
INSERT OR IGNORE INTO samaj_role_permissions VALUES('FAMILY_MEMBER','chat.use');
INSERT OR IGNORE INTO samaj_roles VALUES('VERIFIED_MEMBER');
INSERT OR IGNORE INTO samaj_role_permissions VALUES('VERIFIED_MEMBER','family.view');
INSERT OR IGNORE INTO samaj_role_permissions VALUES('VERIFIED_MEMBER','person.view');
INSERT OR IGNORE INTO samaj_role_permissions VALUES('VERIFIED_MEMBER','directory.search');
INSERT OR IGNORE INTO samaj_role_permissions VALUES('VERIFIED_MEMBER','person.mobile.view');
INSERT OR IGNORE INTO samaj_role_permissions VALUES('VERIFIED_MEMBER','person.address.view');
INSERT OR IGNORE INTO samaj_role_permissions VALUES('VERIFIED_MEMBER','person.dob.view');
INSERT OR IGNORE INTO samaj_role_permissions VALUES('VERIFIED_MEMBER','chat.use');
INSERT OR IGNORE INTO samaj_roles VALUES('GUEST');
INSERT OR IGNORE INTO samaj_role_permissions VALUES('GUEST','family.view');
INSERT OR IGNORE INTO samaj_role_permissions VALUES('GUEST','person.view');
INSERT OR IGNORE INTO samaj_role_permissions VALUES('GUEST','directory.search');
INSERT OR IGNORE INTO batchfee_migrations VALUES(1);
INSERT OR IGNORE INTO batchfee_migrations VALUES(2);
INSERT OR IGNORE INTO samaj_migrations VALUES(1);
INSERT OR IGNORE INTO samaj_migrations VALUES(2);
INSERT OR IGNORE INTO samaj_migrations VALUES(3);
INSERT OR IGNORE INTO tournament_lite_migrations VALUES(1);
INSERT OR IGNORE INTO news_migrations VALUES(1,'2026-10-11T00:00:00.000Z'); INSERT OR IGNORE INTO news_migrations VALUES(2,'2026-10-11T00:00:00.000Z'); INSERT OR IGNORE INTO fund_lens_migrations VALUES(1,'2026-10-11T00:00:00.000Z');
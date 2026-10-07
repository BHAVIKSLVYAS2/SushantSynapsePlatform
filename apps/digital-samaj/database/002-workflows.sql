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
 id TEXT PRIMARY KEY, message_id TEXT NOT NULL REFERENCES samaj_messages(id), name TEXT NOT NULL, mime TEXT NOT NULL, content BLOB NOT NULL
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

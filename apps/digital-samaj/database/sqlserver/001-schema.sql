-- samaj schema, SQL Server 2022+ / Azure SQL. Version 1; one database.

IF SCHEMA_ID(N'samaj') IS NULL EXEC(N'CREATE SCHEMA [samaj] AUTHORIZATION [dbo]');

IF OBJECT_ID(N'[samaj].[samaj_migrations]',N'U') IS NULL
CREATE TABLE [samaj].[samaj_migrations](
 [version] BIGINT NOT NULL PRIMARY KEY
);

IF OBJECT_ID(N'[samaj].[samaj_communities]',N'U') IS NULL
CREATE TABLE [samaj].[samaj_communities](
 [id] NVARCHAR(100) COLLATE Latin1_General_100_BIN2 NOT NULL PRIMARY KEY,
 [name] NVARCHAR(2000) COLLATE Latin1_General_100_BIN2 NOT NULL,
 [created_at] NVARCHAR(100) COLLATE Latin1_General_100_BIN2 NOT NULL
);

IF OBJECT_ID(N'[samaj].[samaj_roles]',N'U') IS NULL
CREATE TABLE [samaj].[samaj_roles](
 [id] NVARCHAR(100) COLLATE Latin1_General_100_BIN2 NOT NULL PRIMARY KEY
);

IF OBJECT_ID(N'[samaj].[samaj_permissions]',N'U') IS NULL
CREATE TABLE [samaj].[samaj_permissions](
 [id] NVARCHAR(100) COLLATE Latin1_General_100_BIN2 NOT NULL PRIMARY KEY
);

IF OBJECT_ID(N'[samaj].[samaj_role_permissions]',N'U') IS NULL
CREATE TABLE [samaj].[samaj_role_permissions](
 [role_id] NVARCHAR(100) COLLATE Latin1_General_100_BIN2 NOT NULL REFERENCES [samaj].[samaj_roles]([id]),
 [permission] NVARCHAR(100) COLLATE Latin1_General_100_BIN2 NOT NULL REFERENCES [samaj].[samaj_permissions]([id]),
 PRIMARY KEY(role_id,permission)
);

IF OBJECT_ID(N'[samaj].[samaj_grants]',N'U') IS NULL
CREATE TABLE [samaj].[samaj_grants](
 [id] NVARCHAR(100) COLLATE Latin1_General_100_BIN2 NOT NULL PRIMARY KEY,
 [user_id] NVARCHAR(100) COLLATE Latin1_General_100_BIN2 NOT NULL REFERENCES [platform].[users]([id]),
 [samaj_id] NVARCHAR(100) COLLATE Latin1_General_100_BIN2 NOT NULL REFERENCES [samaj].[samaj_communities]([id]),
 [role_id] NVARCHAR(100) COLLATE Latin1_General_100_BIN2 NOT NULL REFERENCES [samaj].[samaj_roles]([id]),
 [scope] NVARCHAR(100) COLLATE Latin1_General_100_BIN2 NOT NULL CHECK(scope IN ('ALL','STATE','DISTRICT','VILLAGE','FAMILY','SELF')),
 [scope_value] NVARCHAR(600) COLLATE Latin1_General_100_BIN2 NOT NULL,
 [created_at] NVARCHAR(100) COLLATE Latin1_General_100_BIN2 NOT NULL,
 UNIQUE(user_id,samaj_id,role_id,scope,scope_hash),
 scope_hash AS CONVERT(BINARY(32),HASHBYTES('SHA2_256',scope_value)) PERSISTED
);

IF OBJECT_ID(N'[samaj].[samaj_persons]',N'U') IS NULL
CREATE TABLE [samaj].[samaj_persons](
 [id] NVARCHAR(100) COLLATE Latin1_General_100_BIN2 NOT NULL PRIMARY KEY,
 [samaj_id] NVARCHAR(100) COLLATE Latin1_General_100_BIN2 NOT NULL REFERENCES [samaj].[samaj_communities]([id]),
 [code] NVARCHAR(100) COLLATE Latin1_General_100_BIN2 NOT NULL UNIQUE,
 [status] NVARCHAR(100) COLLATE Latin1_General_100_BIN2 NOT NULL CHECK(status IN ('DRAFT','SUBMITTED','UNDER_REVIEW','CORRECTION_REQUIRED','VERIFIED','REJECTED','ARCHIVED')),
 [revision] BIGINT NOT NULL DEFAULT 1,
 [data] NVARCHAR(MAX) COLLATE Latin1_General_100_BIN2 NOT NULL CHECK(ISJSON(data, VALUE)=1),
 [privacy] NVARCHAR(MAX) COLLATE Latin1_General_100_BIN2 NOT NULL CHECK(ISJSON(privacy, VALUE)=1),
 [created_by] NVARCHAR(100) COLLATE Latin1_General_100_BIN2 NOT NULL REFERENCES [platform].[users]([id]),
 [created_at] NVARCHAR(100) COLLATE Latin1_General_100_BIN2 NOT NULL,
 [updated_at] NVARCHAR(100) COLLATE Latin1_General_100_BIN2 NOT NULL,
 [merged_into] NVARCHAR(100) COLLATE Latin1_General_100_BIN2 REFERENCES [samaj].[samaj_persons]([id])
);

IF OBJECT_ID(N'[samaj].[samaj_families]',N'U') IS NULL
CREATE TABLE [samaj].[samaj_families](
 [id] NVARCHAR(100) COLLATE Latin1_General_100_BIN2 NOT NULL PRIMARY KEY,
 [samaj_id] NVARCHAR(100) COLLATE Latin1_General_100_BIN2 NOT NULL REFERENCES [samaj].[samaj_communities]([id]),
 [code] NVARCHAR(100) COLLATE Latin1_General_100_BIN2 NOT NULL UNIQUE,
 [head_id] NVARCHAR(100) COLLATE Latin1_General_100_BIN2 REFERENCES [samaj].[samaj_persons]([id]),
 [status] NVARCHAR(100) COLLATE Latin1_General_100_BIN2 NOT NULL CHECK(status IN ('DRAFT','SUBMITTED','UNDER_REVIEW','CORRECTION_REQUIRED','VERIFIED','REJECTED','ARCHIVED')),
 [revision] BIGINT NOT NULL DEFAULT 1,
 [data] NVARCHAR(MAX) COLLATE Latin1_General_100_BIN2 NOT NULL CHECK(ISJSON(data, VALUE)=1),
 [privacy] NVARCHAR(MAX) COLLATE Latin1_General_100_BIN2 NOT NULL CHECK(ISJSON(privacy, VALUE)=1),
 [created_by] NVARCHAR(100) COLLATE Latin1_General_100_BIN2 NOT NULL REFERENCES [platform].[users]([id]),
 [created_at] NVARCHAR(100) COLLATE Latin1_General_100_BIN2 NOT NULL,
 [updated_at] NVARCHAR(100) COLLATE Latin1_General_100_BIN2 NOT NULL
);

IF OBJECT_ID(N'[samaj].[samaj_memberships]',N'U') IS NULL
CREATE TABLE [samaj].[samaj_memberships](
 [id] NVARCHAR(100) COLLATE Latin1_General_100_BIN2 NOT NULL PRIMARY KEY,
 [person_id] NVARCHAR(100) COLLATE Latin1_General_100_BIN2 NOT NULL REFERENCES [samaj].[samaj_persons]([id]),
 [family_id] NVARCHAR(100) COLLATE Latin1_General_100_BIN2 NOT NULL REFERENCES [samaj].[samaj_families]([id]),
 [type] NVARCHAR(100) COLLATE Latin1_General_100_BIN2 NOT NULL CHECK(type IN ('BirthFamily','MaritalFamily','GuardianFamily','Other')),
 [is_primary] BIGINT NOT NULL CHECK(is_primary IN (0,1)),
 [start_date] NVARCHAR(100) COLLATE Latin1_General_100_BIN2 NOT NULL DEFAULT '',
 [end_date] NVARCHAR(100) COLLATE Latin1_General_100_BIN2 NOT NULL DEFAULT '',
 UNIQUE(person_id,family_id,type)
);

IF OBJECT_ID(N'[samaj].[samaj_relationships]',N'U') IS NULL
CREATE TABLE [samaj].[samaj_relationships](
 [id] NVARCHAR(100) COLLATE Latin1_General_100_BIN2 NOT NULL PRIMARY KEY,
 [person_id] NVARCHAR(100) COLLATE Latin1_General_100_BIN2 NOT NULL REFERENCES [samaj].[samaj_persons]([id]),
 [related_id] NVARCHAR(100) COLLATE Latin1_General_100_BIN2 NOT NULL REFERENCES [samaj].[samaj_persons]([id]),
 [type] NVARCHAR(100) COLLATE Latin1_General_100_BIN2 NOT NULL CHECK(type IN ('Father','Mother','Parent','Spouse','Sibling','Guardian','Other')),
 [status] NVARCHAR(100) COLLATE Latin1_General_100_BIN2 NOT NULL DEFAULT 'SUBMITTED',
 [end_date] NVARCHAR(100) COLLATE Latin1_General_100_BIN2 NOT NULL DEFAULT '',
 [created_by] NVARCHAR(100) COLLATE Latin1_General_100_BIN2 NOT NULL REFERENCES [platform].[users]([id]),
 CHECK(person_id<>related_id),
 UNIQUE(person_id,related_id,type)
);

IF OBJECT_ID(N'[samaj].[samaj_user_person]',N'U') IS NULL
CREATE TABLE [samaj].[samaj_user_person](
 [user_id] NVARCHAR(100) COLLATE Latin1_General_100_BIN2 NOT NULL REFERENCES [platform].[users]([id]),
 [samaj_id] NVARCHAR(100) COLLATE Latin1_General_100_BIN2 NOT NULL REFERENCES [samaj].[samaj_communities]([id]),
 [person_id] NVARCHAR(100) COLLATE Latin1_General_100_BIN2 NOT NULL UNIQUE REFERENCES [samaj].[samaj_persons]([id]),
 PRIMARY KEY(user_id,samaj_id)
);

IF OBJECT_ID(N'[samaj].[samaj_reviews]',N'U') IS NULL
CREATE TABLE [samaj].[samaj_reviews](
 [id] NVARCHAR(100) COLLATE Latin1_General_100_BIN2 NOT NULL PRIMARY KEY,
 [samaj_id] NVARCHAR(100) COLLATE Latin1_General_100_BIN2 NOT NULL REFERENCES [samaj].[samaj_communities]([id]),
 [kind] NVARCHAR(100) COLLATE Latin1_General_100_BIN2 NOT NULL,
 [entity_id] NVARCHAR(100) COLLATE Latin1_General_100_BIN2 NOT NULL,
 [requested_by] NVARCHAR(100) COLLATE Latin1_General_100_BIN2 NOT NULL REFERENCES [platform].[users]([id]),
 [status] NVARCHAR(100) COLLATE Latin1_General_100_BIN2 NOT NULL DEFAULT 'PENDING',
 [old_value] NVARCHAR(MAX) COLLATE Latin1_General_100_BIN2 NOT NULL CHECK(ISJSON(old_value, VALUE)=1),
 [new_value] NVARCHAR(MAX) COLLATE Latin1_General_100_BIN2 NOT NULL CHECK(ISJSON(new_value, VALUE)=1),
 [created_at] NVARCHAR(100) COLLATE Latin1_General_100_BIN2 NOT NULL,
 [reviewed_by] NVARCHAR(100) COLLATE Latin1_General_100_BIN2 REFERENCES [platform].[users]([id]),
 [reviewed_at] NVARCHAR(100) COLLATE Latin1_General_100_BIN2,
 [reason] NVARCHAR(2000) COLLATE Latin1_General_100_BIN2 NOT NULL DEFAULT '',
 family_key AS CONVERT(NVARCHAR(100),COALESCE(JSON_VALUE(new_value,'$.familyId'),'')) PERSISTED,
 related_key AS CONVERT(NVARCHAR(100),COALESCE(JSON_VALUE(new_value,'$.relatedId'),'')) PERSISTED,
 type_key AS CONVERT(NVARCHAR(100),COALESCE(JSON_VALUE(new_value,'$.type'),'')) PERSISTED
);

IF OBJECT_ID(N'[samaj].[samaj_audit]',N'U') IS NULL
CREATE TABLE [samaj].[samaj_audit](
 [id] NVARCHAR(100) COLLATE Latin1_General_100_BIN2 NOT NULL PRIMARY KEY,
 [samaj_id] NVARCHAR(100) COLLATE Latin1_General_100_BIN2 NOT NULL REFERENCES [samaj].[samaj_communities]([id]),
 [actor] NVARCHAR(100) COLLATE Latin1_General_100_BIN2 NOT NULL REFERENCES [platform].[users]([id]),
 [action] NVARCHAR(100) COLLATE Latin1_General_100_BIN2 NOT NULL,
 [entity_id] NVARCHAR(100) COLLATE Latin1_General_100_BIN2 NOT NULL,
 [old_value] NVARCHAR(MAX) COLLATE Latin1_General_100_BIN2 NOT NULL CHECK(ISJSON(old_value, VALUE)=1),
 [new_value] NVARCHAR(MAX) COLLATE Latin1_General_100_BIN2 NOT NULL CHECK(ISJSON(new_value, VALUE)=1),
 [at] NVARCHAR(100) COLLATE Latin1_General_100_BIN2 NOT NULL
);

IF OBJECT_ID(N'[samaj].[samaj_consent]',N'U') IS NULL
CREATE TABLE [samaj].[samaj_consent](
 [id] NVARCHAR(100) COLLATE Latin1_General_100_BIN2 NOT NULL PRIMARY KEY,
 [family_id] NVARCHAR(100) COLLATE Latin1_General_100_BIN2 NOT NULL REFERENCES [samaj].[samaj_families]([id]),
 [user_id] NVARCHAR(100) COLLATE Latin1_General_100_BIN2 NOT NULL REFERENCES [platform].[users]([id]),
 [version] NVARCHAR(100) COLLATE Latin1_General_100_BIN2 NOT NULL,
 [given_at] NVARCHAR(100) COLLATE Latin1_General_100_BIN2 NOT NULL
);

IF OBJECT_ID(N'[samaj].[samaj_files]',N'U') IS NULL
CREATE TABLE [samaj].[samaj_files](
 [id] NVARCHAR(100) COLLATE Latin1_General_100_BIN2 NOT NULL PRIMARY KEY,
 [samaj_id] NVARCHAR(100) COLLATE Latin1_General_100_BIN2 NOT NULL REFERENCES [samaj].[samaj_communities]([id]),
 [person_id] NVARCHAR(100) COLLATE Latin1_General_100_BIN2 REFERENCES [samaj].[samaj_persons]([id]),
 [family_id] NVARCHAR(100) COLLATE Latin1_General_100_BIN2 REFERENCES [samaj].[samaj_families]([id]),
 [name] NVARCHAR(2000) COLLATE Latin1_General_100_BIN2 NOT NULL,
 [mime] NVARCHAR(100) COLLATE Latin1_General_100_BIN2 NOT NULL,
 [content] VARBINARY(MAX) NOT NULL,
 [created_by] NVARCHAR(100) COLLATE Latin1_General_100_BIN2 NOT NULL REFERENCES [platform].[users]([id]),
 [created_at] NVARCHAR(100) COLLATE Latin1_General_100_BIN2 NOT NULL,
 CHECK((person_id IS NULL AND family_id IS NOT NULL) OR (person_id IS NOT NULL AND family_id IS NULL))
);

IF OBJECT_ID(N'[samaj].[samaj_drafts]',N'U') IS NULL
CREATE TABLE [samaj].[samaj_drafts](
 [id] NVARCHAR(100) COLLATE Latin1_General_100_BIN2 NOT NULL PRIMARY KEY,
 [samaj_id] NVARCHAR(100) COLLATE Latin1_General_100_BIN2 NOT NULL REFERENCES [samaj].[samaj_communities]([id]),
 [user_id] NVARCHAR(100) COLLATE Latin1_General_100_BIN2 NOT NULL REFERENCES [platform].[users]([id]),
 [revision] BIGINT NOT NULL DEFAULT 1,
 [step] BIGINT NOT NULL DEFAULT 0 CHECK(step BETWEEN 0 AND 9),
 [data] NVARCHAR(MAX) COLLATE Latin1_General_100_BIN2 NOT NULL CHECK(ISJSON(data, VALUE)=1),
 [submitted_family_id] NVARCHAR(100) COLLATE Latin1_General_100_BIN2 REFERENCES [samaj].[samaj_families]([id]),
 [updated_at] NVARCHAR(100) COLLATE Latin1_General_100_BIN2 NOT NULL
);

IF OBJECT_ID(N'[samaj].[samaj_duplicate_decisions]',N'U') IS NULL
CREATE TABLE [samaj].[samaj_duplicate_decisions](
 [person_id] NVARCHAR(100) COLLATE Latin1_General_100_BIN2 NOT NULL REFERENCES [samaj].[samaj_persons]([id]),
 [related_id] NVARCHAR(100) COLLATE Latin1_General_100_BIN2 NOT NULL REFERENCES [samaj].[samaj_persons]([id]),
 [decision] NVARCHAR(100) COLLATE Latin1_General_100_BIN2 NOT NULL CHECK(decision IN ('IGNORE','MERGE')),
 [actor] NVARCHAR(100) COLLATE Latin1_General_100_BIN2 NOT NULL REFERENCES [platform].[users]([id]),
 [at] NVARCHAR(100) COLLATE Latin1_General_100_BIN2 NOT NULL,
 PRIMARY KEY(person_id,related_id)
);

IF OBJECT_ID(N'[samaj].[samaj_import_jobs]',N'U') IS NULL
CREATE TABLE [samaj].[samaj_import_jobs](
 [id] NVARCHAR(100) COLLATE Latin1_General_100_BIN2 NOT NULL PRIMARY KEY,
 [samaj_id] NVARCHAR(100) COLLATE Latin1_General_100_BIN2 NOT NULL REFERENCES [samaj].[samaj_communities]([id]),
 [created_by] NVARCHAR(100) COLLATE Latin1_General_100_BIN2 NOT NULL REFERENCES [platform].[users]([id]),
 [status] NVARCHAR(100) COLLATE Latin1_General_100_BIN2 NOT NULL,
 [data] NVARCHAR(MAX) COLLATE Latin1_General_100_BIN2 NOT NULL CHECK(ISJSON(data, VALUE)=1),
 [created_at] NVARCHAR(100) COLLATE Latin1_General_100_BIN2 NOT NULL
);

IF OBJECT_ID(N'[samaj].[samaj_message_preferences]',N'U') IS NULL
CREATE TABLE [samaj].[samaj_message_preferences](
 [user_id] NVARCHAR(100) COLLATE Latin1_General_100_BIN2 NOT NULL REFERENCES [platform].[users]([id]),
 [samaj_id] NVARCHAR(100) COLLATE Latin1_General_100_BIN2 NOT NULL REFERENCES [samaj].[samaj_communities]([id]),
 [visibility] NVARCHAR(100) COLLATE Latin1_General_100_BIN2 NOT NULL CHECK(visibility IN ('Nobody','FamilyOnly','VerifiedMembers','Connections','SamajMembers')),
 PRIMARY KEY(user_id,samaj_id)
);

IF OBJECT_ID(N'[samaj].[samaj_blocks]',N'U') IS NULL
CREATE TABLE [samaj].[samaj_blocks](
 [user_id] NVARCHAR(100) COLLATE Latin1_General_100_BIN2 NOT NULL REFERENCES [platform].[users]([id]),
 [blocked_id] NVARCHAR(100) COLLATE Latin1_General_100_BIN2 NOT NULL REFERENCES [platform].[users]([id]),
 PRIMARY KEY(user_id,blocked_id),
 CHECK(user_id<>blocked_id)
);

IF OBJECT_ID(N'[samaj].[samaj_conversations]',N'U') IS NULL
CREATE TABLE [samaj].[samaj_conversations](
 [id] NVARCHAR(100) COLLATE Latin1_General_100_BIN2 NOT NULL PRIMARY KEY,
 [samaj_id] NVARCHAR(100) COLLATE Latin1_General_100_BIN2 NOT NULL REFERENCES [samaj].[samaj_communities]([id]),
 [sender] NVARCHAR(100) COLLATE Latin1_General_100_BIN2 NOT NULL REFERENCES [platform].[users]([id]),
 [receiver] NVARCHAR(100) COLLATE Latin1_General_100_BIN2 NOT NULL REFERENCES [platform].[users]([id]),
 [reason] NVARCHAR(2000) COLLATE Latin1_General_100_BIN2 NOT NULL,
 [status] NVARCHAR(100) COLLATE Latin1_General_100_BIN2 NOT NULL CHECK(status IN ('PENDING','ACCEPTED','DECLINED')),
 [created_at] NVARCHAR(100) COLLATE Latin1_General_100_BIN2 NOT NULL,
 CHECK(sender<>receiver),
 pair_low AS (CASE WHEN sender<receiver THEN sender ELSE receiver END) PERSISTED,
 pair_high AS (CASE WHEN sender<receiver THEN receiver ELSE sender END) PERSISTED
);

IF OBJECT_ID(N'[samaj].[samaj_participants]',N'U') IS NULL
CREATE TABLE [samaj].[samaj_participants](
 [conversation_id] NVARCHAR(100) COLLATE Latin1_General_100_BIN2 NOT NULL REFERENCES [samaj].[samaj_conversations]([id]),
 [user_id] NVARCHAR(100) COLLATE Latin1_General_100_BIN2 NOT NULL REFERENCES [platform].[users]([id]),
 [read_at] NVARCHAR(100) COLLATE Latin1_General_100_BIN2 NOT NULL DEFAULT '',
 [muted] BIGINT NOT NULL DEFAULT 0 CHECK(muted IN (0,1)),
 PRIMARY KEY(conversation_id,user_id)
);

IF OBJECT_ID(N'[samaj].[samaj_messages]',N'U') IS NULL
CREATE TABLE [samaj].[samaj_messages](
 [id] NVARCHAR(100) COLLATE Latin1_General_100_BIN2 NOT NULL PRIMARY KEY,
 [conversation_id] NVARCHAR(100) COLLATE Latin1_General_100_BIN2 NOT NULL REFERENCES [samaj].[samaj_conversations]([id]),
 [sender] NVARCHAR(100) COLLATE Latin1_General_100_BIN2 NOT NULL REFERENCES [platform].[users]([id]),
 [body] NVARCHAR(MAX) COLLATE Latin1_General_100_BIN2 NOT NULL,
 [created_at] NVARCHAR(100) COLLATE Latin1_General_100_BIN2 NOT NULL
);

IF OBJECT_ID(N'[samaj].[samaj_message_attachments]',N'U') IS NULL
CREATE TABLE [samaj].[samaj_message_attachments](
 [id] NVARCHAR(100) COLLATE Latin1_General_100_BIN2 NOT NULL PRIMARY KEY,
 [message_id] NVARCHAR(100) COLLATE Latin1_General_100_BIN2 NOT NULL REFERENCES [samaj].[samaj_messages]([id]),
 [name] NVARCHAR(2000) COLLATE Latin1_General_100_BIN2 NOT NULL,
 [mime] NVARCHAR(100) COLLATE Latin1_General_100_BIN2 NOT NULL,
 [content] VARBINARY(MAX) NOT NULL
);

IF OBJECT_ID(N'[samaj].[samaj_message_reports]',N'U') IS NULL
CREATE TABLE [samaj].[samaj_message_reports](
 [id] NVARCHAR(100) COLLATE Latin1_General_100_BIN2 NOT NULL PRIMARY KEY,
 [message_id] NVARCHAR(100) COLLATE Latin1_General_100_BIN2 NOT NULL REFERENCES [samaj].[samaj_messages]([id]),
 [reporter] NVARCHAR(100) COLLATE Latin1_General_100_BIN2 NOT NULL REFERENCES [platform].[users]([id]),
 [reason] NVARCHAR(2000) COLLATE Latin1_General_100_BIN2 NOT NULL,
 [status] NVARCHAR(100) COLLATE Latin1_General_100_BIN2 NOT NULL DEFAULT 'OPEN',
 [created_at] NVARCHAR(100) COLLATE Latin1_General_100_BIN2 NOT NULL
);

IF OBJECT_ID(N'[samaj].[samaj_announcements]',N'U') IS NULL
CREATE TABLE [samaj].[samaj_announcements](
 [id] NVARCHAR(100) COLLATE Latin1_General_100_BIN2 NOT NULL PRIMARY KEY,
 [samaj_id] NVARCHAR(100) COLLATE Latin1_General_100_BIN2 NOT NULL REFERENCES [samaj].[samaj_communities]([id]),
 [title] NVARCHAR(2000) COLLATE Latin1_General_100_BIN2 NOT NULL,
 [body] NVARCHAR(MAX) COLLATE Latin1_General_100_BIN2 NOT NULL,
 [actor] NVARCHAR(100) COLLATE Latin1_General_100_BIN2 NOT NULL REFERENCES [platform].[users]([id]),
 [created_at] NVARCHAR(100) COLLATE Latin1_General_100_BIN2 NOT NULL
);

IF OBJECT_ID(N'[samaj].[samaj_events]',N'U') IS NULL
CREATE TABLE [samaj].[samaj_events](
 [id] NVARCHAR(100) COLLATE Latin1_General_100_BIN2 NOT NULL PRIMARY KEY,
 [samaj_id] NVARCHAR(100) COLLATE Latin1_General_100_BIN2 NOT NULL REFERENCES [samaj].[samaj_communities]([id]),
 [title] NVARCHAR(2000) COLLATE Latin1_General_100_BIN2 NOT NULL,
 [starts_at] NVARCHAR(100) COLLATE Latin1_General_100_BIN2 NOT NULL,
 [location] NVARCHAR(100) COLLATE Latin1_General_100_BIN2 NOT NULL,
 [description] NVARCHAR(MAX) COLLATE Latin1_General_100_BIN2 NOT NULL,
 [family_id] NVARCHAR(100) COLLATE Latin1_General_100_BIN2 REFERENCES [samaj].[samaj_families]([id]),
 [created_by] NVARCHAR(100) COLLATE Latin1_General_100_BIN2 NOT NULL REFERENCES [platform].[users]([id]),
 [cancelled] BIGINT NOT NULL DEFAULT 0
);

IF OBJECT_ID(N'[samaj].[samaj_event_rsvps]',N'U') IS NULL
CREATE TABLE [samaj].[samaj_event_rsvps](
 [event_id] NVARCHAR(100) COLLATE Latin1_General_100_BIN2 NOT NULL REFERENCES [samaj].[samaj_events]([id]),
 [user_id] NVARCHAR(100) COLLATE Latin1_General_100_BIN2 NOT NULL REFERENCES [platform].[users]([id]),
 [response] NVARCHAR(100) COLLATE Latin1_General_100_BIN2 NOT NULL CHECK(response IN ('Going','Maybe','Not going')),
 PRIMARY KEY(event_id,user_id)
);

IF NOT EXISTS(SELECT 1 FROM sys.indexes WHERE object_id=OBJECT_ID(N'[samaj].[samaj_memberships]') AND name=N'samaj_primary_family')
CREATE UNIQUE INDEX [samaj_primary_family] ON [samaj].[samaj_memberships](person_id) WHERE is_primary=1 AND end_date='';

IF NOT EXISTS(SELECT 1 FROM sys.indexes WHERE object_id=OBJECT_ID(N'[samaj].[samaj_reviews]') AND name=N'samaj_pending_review')
CREATE UNIQUE INDEX [samaj_pending_review] ON [samaj].[samaj_reviews](kind,entity_id,family_key,related_key,type_key) WHERE status='PENDING';

IF NOT EXISTS(SELECT 1 FROM sys.indexes WHERE object_id=OBJECT_ID(N'[samaj].[samaj_persons]') AND name=N'samaj_person_community')
CREATE INDEX [samaj_person_community] ON [samaj].[samaj_persons](samaj_id,status);

IF NOT EXISTS(SELECT 1 FROM sys.indexes WHERE object_id=OBJECT_ID(N'[samaj].[samaj_families]') AND name=N'samaj_family_community')
CREATE INDEX [samaj_family_community] ON [samaj].[samaj_families](samaj_id,status);

IF NOT EXISTS(SELECT 1 FROM sys.indexes WHERE object_id=OBJECT_ID(N'[samaj].[samaj_memberships]') AND name=N'samaj_membership_family')
CREATE INDEX [samaj_membership_family] ON [samaj].[samaj_memberships](family_id);

IF NOT EXISTS(SELECT 1 FROM sys.indexes WHERE object_id=OBJECT_ID(N'[samaj].[samaj_relationships]') AND name=N'samaj_relationship_related')
CREATE INDEX [samaj_relationship_related] ON [samaj].[samaj_relationships](related_id);

IF NOT EXISTS(SELECT 1 FROM sys.indexes WHERE object_id=OBJECT_ID(N'[samaj].[samaj_grants]') AND name=N'samaj_grant_user')
CREATE INDEX [samaj_grant_user] ON [samaj].[samaj_grants](user_id,samaj_id);

IF NOT EXISTS(SELECT 1 FROM sys.indexes WHERE object_id=OBJECT_ID(N'[samaj].[samaj_reviews]') AND name=N'samaj_review_queue')
CREATE INDEX [samaj_review_queue] ON [samaj].[samaj_reviews](samaj_id,status);

IF NOT EXISTS(SELECT 1 FROM sys.indexes WHERE object_id=OBJECT_ID(N'[samaj].[samaj_conversations]') AND name=N'samaj_open_conversation')
CREATE UNIQUE INDEX [samaj_open_conversation] ON [samaj].[samaj_conversations](samaj_id,pair_low,pair_high);

IF NOT EXISTS(SELECT 1 FROM sys.indexes WHERE object_id=OBJECT_ID(N'[samaj].[samaj_messages]') AND name=N'samaj_message_thread')
CREATE INDEX [samaj_message_thread] ON [samaj].[samaj_messages](conversation_id,created_at);

IF NOT EXISTS(SELECT 1 FROM sys.indexes WHERE object_id=OBJECT_ID(N'[samaj].[samaj_conversations]') AND name=N'samaj_conversations_receiver')
CREATE INDEX [samaj_conversations_receiver] ON [samaj].[samaj_conversations](receiver,samaj_id);

IF NOT EXISTS(SELECT 1 FROM sys.indexes WHERE object_id=OBJECT_ID(N'[samaj].[samaj_drafts]') AND name=N'samaj_draft_owner')
CREATE INDEX [samaj_draft_owner] ON [samaj].[samaj_drafts](user_id,samaj_id);

IF NOT EXISTS(SELECT 1 FROM sys.indexes WHERE object_id=OBJECT_ID(N'[samaj].[samaj_events]') AND name=N'samaj_events_calendar')
CREATE INDEX [samaj_events_calendar] ON [samaj].[samaj_events](samaj_id,starts_at);

EXEC(N'CREATE OR ALTER TRIGGER [samaj].[samaj_audit_no_update] ON [samaj].[samaj_audit] INSTEAD OF UPDATE AS BEGIN THROW 51000, ''Audit is append only'', 1; END');

EXEC(N'CREATE OR ALTER TRIGGER [samaj].[samaj_audit_no_delete] ON [samaj].[samaj_audit] INSTEAD OF DELETE AS BEGIN THROW 51000, ''Audit is append only'', 1; END');

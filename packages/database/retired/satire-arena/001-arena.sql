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

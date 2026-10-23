CREATE TABLE IF NOT EXISTS arena_anchors_votes (voter TEXT NOT NULL,character TEXT NOT NULL CHECK(character IN ('roar-nab','ravish-reflection','sudhir-studio','anjana-awaaz','rajat-ruling','rubika-rapid')),round TEXT NOT NULL,reaction TEXT NOT NULL CHECK(reaction IN ('garland','shoe','finger','applause','tomato','laugh')),updated_at TEXT NOT NULL,PRIMARY KEY(voter,character,round));
CREATE INDEX IF NOT EXISTS arena_anchors_counts ON arena_anchors_votes(round,character,reaction);
DROP VIEW IF EXISTS arena_all_votes;
CREATE VIEW arena_all_votes AS
 SELECT voter,character,round,reaction,updated_at FROM (
 SELECT *,ROW_NUMBER() OVER(PARTITION BY voter,character,round ORDER BY updated_at DESC,source DESC) AS position FROM (
 SELECT * FROM (
 SELECT voter,character,round,reaction,updated_at,0 AS source FROM arena_votes
 UNION ALL SELECT voter,character,round,reaction,updated_at,1 AS source FROM arena_expanded_votes
 UNION ALL SELECT voter,character,round,reaction,updated_at,2 AS source FROM arena_cast_votes
 )
 UNION ALL SELECT * FROM (
 SELECT voter,character,round,reaction,updated_at,3 AS source FROM arena_additions_votes
 UNION ALL SELECT voter,character,round,reaction,updated_at,4 AS source FROM arena_speakers_votes
  UNION ALL SELECT voter,character,round,reaction,updated_at,5 AS source FROM arena_anchors_votes
 )
 )) WHERE position=1;

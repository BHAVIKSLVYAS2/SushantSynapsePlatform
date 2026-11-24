-- One-time production cleanup after all Arena routes return 404.
DELETE FROM arena_votes;
DELETE FROM arena_expanded_votes;
DELETE FROM arena_cast_votes;
DELETE FROM arena_additions_votes;
DELETE FROM arena_speakers_votes;
DELETE FROM arena_anchors_votes;
DELETE FROM arena_spotlight_votes;
DELETE FROM arena_boardroom_votes;
DELETE FROM settings WHERE id IN ('satire-arena-editorial-v1','satire-arena-aggregate-events-v1');
DELETE FROM platform_app_assignments WHERE appId='satire-arena';
DELETE FROM platform_app_licences WHERE appId='satire-arena';
DELETE FROM app_access WHERE appId='satire-arena';

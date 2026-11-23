-- ONE-TIME, explicitly authorised Tournament Lite data retirement (2026-11-23).
-- Not an automatic migration: never run this from startup or deploy.
-- Shared identities, memberships, other apps, audit history and backups stay intact.
DELETE FROM tournament_lite_ownership;
DELETE FROM tournament_lite_events;
DELETE FROM platform_app_assignments WHERE appId='tournament-lite';
DELETE FROM platform_app_licences WHERE appId='tournament-lite';
DELETE FROM app_access WHERE appId='tournament-lite';
SELECT 'events' AS kind,COUNT(*) AS n FROM tournament_lite_events
UNION ALL SELECT 'ownership',COUNT(*) FROM tournament_lite_ownership
UNION ALL SELECT 'assignments',COUNT(*) FROM platform_app_assignments WHERE appId='tournament-lite'
UNION ALL SELECT 'licences',COUNT(*) FROM platform_app_licences WHERE appId='tournament-lite'
UNION ALL SELECT 'legacy-access',COUNT(*) FROM app_access WHERE appId='tournament-lite';

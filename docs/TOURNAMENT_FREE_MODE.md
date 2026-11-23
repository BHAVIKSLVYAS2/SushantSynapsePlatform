# Tournament Lite: free browser mode

User authorised no login, no organisation/licence requirement and deletion of
only old Tournament Lite data on 23 November 2026. Shared accounts and other
applications remain separate. A unified account/saving design is future work.

The public catalogue opens `/tournament-lite` directly. Tournaments save under
`synapse-tournament-lite-v1` in this browser profile. Clearing site data removes
them; there is no cloud sync. Download backup exports a JSON copy (automatic
restore/import is not implemented). Print results prints the selected tab;
winner PNG export remains available. Public live links and publishing are removed.
Old `?share=` URLs open the free app with its browser-mode notice, without loading
the old event. No old cloud tournaments are copied into visitors' browsers.

`build.cjs` bundles the existing sport/fixture engine for the browser, substituting
Web Crypto randomness for Node crypto. Validation, progression and scheduling
rules remain shared. `frontend/storage.js` validates writes before replacing local
state, reports quota/blocked storage errors and rejects observed stale-tab edits.
This is localStorage, not a distributed transaction or a shared editing service.

Node and Workers return 410 for every `/api/tournament-lite` route. Workers do so
before opening D1. Node no longer mounts/initialises the Tournament database
adapter. Organisation account/admin assignment lists omit Tournament; public
catalogue and platform-launch preferences continue using the common registry.
Historical adapters and SQL schema remain for old recovery compatibility, but are
not mounted. Do not reuse them to reopen old unauthenticated APIs.

`apps/tournament-lite/database/retire-live-data.sql` is a one-time production
cleanup, not a startup migration. It deletes events, ownership and only
Tournament-specific assignments/licences/legacy app-access rows. Shared tables,
accounts, memberships, other apps, audit history and older backups are preserved.
Empty historical tables remain to avoid breaking schema/recovery compatibility.
Do not repeat the old organisation cutover or this cleanup during deployment.

Verification: 10 existing sport/engine/legacy-adapter unit checks, four new free
mode checks (all six sports/four formats, no-D1 retired APIs, no workspace roles,
scoped one-time SQL deletion),
and five real Chrome workflows pass. Chrome covers no-login home entry, scoring,
BYEs, corrections, winner PNG and JSON downloads, reload/theme persistence,
separate browser isolation, scheduling/standings, invalid dates, stale tabs,
storage failures and corrupt data preservation. Mobile screenshot inspected.
Release/deletion evidence is recorded in the functionality ledger.

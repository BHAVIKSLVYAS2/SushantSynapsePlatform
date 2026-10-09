# Platform audit implementation — 2026-10-09

The user authorized the complete audit backlog and thirteen proposed additions. Existing accounts, records, files and legacy migration inputs are preserved. Tests use isolated temporary data directories. New private business state stays in SQLite; public creative-tool inputs remain in their tab unless the user explicitly exports them.

## Changes

| Audit item | Implementation and boundary |
|---|---|
| I1 | Captured comparison selection, cancellation and replacement comparison prevent obsolete results after a share-link change. |
| I2 | Pending explicit backup payload/destination authorization. Automatic approval review rejected scheduled export of account hashes, documents and audit history to an unspecified destination. No scheduled backup or off-device connection was added. |
| I3 | Moment Studio warns before switching sections with an unfinished draft. Dismissing the warning retains it. |
| I4 | Five official PPFAS examples refreshed and validated to 30 September 2026. Scheduled CI delivery is prepared and runs only when Cloudflare repository secrets are configured. Their configuration is not verified. |
| I5 / A4 | IST scheduling checks estimated interval overlap for courts, participant entries and named team members; next-free-slot suggestions search up to seven days. Defaults are estimates, not live court reservations. |
| I6–I8 | Catalogue categories derive from the registry; eight Pocket Pause modes and merged Moment Studio naming appear in discovery/fallback copy. Historical deployment sections are explicitly labelled as checkpoints. |
| I9 | Public Fund requests are paced to 24 starts/minute in this tab, including continuations; successful snapshots are retained briefly for retry. Shared-IP quota competition from other devices remains possible. |
| I10 | Directory family data and read-only membership permissions use bulk request-scoped lookups. Write permissions read current memberships so newly linked records remain accessible. Privacy projection precedes directory pagination. Full directory scanning still needs production-scale evaluation. |
| A1 | Public home searches app names and activity keywords, with Create / Organize / Play / Learn filters. |
| A2 | General, civil and criminal hearing-preparation templates create three case-linked tasks with a manually entered due date. Same case/template/date is idempotent. Review the tasks for the actual matter. |
| A3 | Samaj events can target the community or a family whose existing visibility permissions apply. Administrators create/cancel; users opt in with account-owned responses. Counts are shown, attendee identities are not. No outbound reminders. |
| A5 | Owner-delegated Viewer, Collector and Manager roles require both the app grant and SQLite role. Collector records payments; Manager also handles ordinary academy operations. Settings, full backups, reversals and waivers remain owner-only. Revocation is enforced on subsequent requests. |
| A6 | Temporary absence cover suggests qualified, available teachers without simultaneous double booking. A dated CSV marks uncovered lessons; the weekly timetable stays intact. Suggestions need organizer review. |
| A7 | Selected funds show date/coverage and offer Check coverage before comparison. The short-lived verified snapshot can be reused for comparison. |
| A8 | BBC fallback includes science, health and Asia feeds within fixed-host, dated-source validation. Light reading simplifies the illustrated layout. Historical availability is not guaranteed. |
| A9 | Recipient CSV preview and branded PDF ZIP batches of 1–20 certificates. Optional descriptions override common wording; shared branding/signature apply. Limits: 50 KB CSV and 50 MB output. No recipient upload or persistence. |
| A10 | Decision Wheel validates JSON list import/export; importing clears old picks. |
| A11 | Easy / Medium / Hard practice. Easy uses smaller numbers solvable without division; Hard requires division. Versioned daily puzzles stay unchanged. |
| A12 | Exact-name keep-together/apart groups, balanced team sizes and bounded constraint search. Impossible/conflicting rules produce a clear error. |
| A13 | Mood-based break chooser and PNG quilt export bearing the platform logo/name. No scores, streaks or compulsory timers. |

## Verification and release

Final verification and release identifiers are recorded at the top of [FUNCTIONALITY_LEDGER.md](FUNCTIONALITY_LEDGER.md). Frontend deployment and private Node deployment have separate evidence. CI hosting secrets, off-device backups, always-on hosting, messaging providers and payment entitlements are not represented as connected.

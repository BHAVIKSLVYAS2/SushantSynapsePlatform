# Chambers organisation preview boundary

`organisation-routes.mjs` and `organisation-store.mjs` are used only by the guarded
temporary Node administration preview. Default runtime and Cloudflare are unchanged.
No real database migration is authorised by these modules.

API: `GET /api/chambers` lists the signed-in user's usable Chambers assignments.
`/api/chambers/<organisationId>/<operation>` accepts the existing Chambers business
operations: state, validated record POST/PATCH, document download, hearing outcome,
preparation tasks, settings, backup and restore. Existing frontend search, reports,
printing and exports derive from state; the new state contains only the selected
organisation. The guarded preview frontend now selects and calls these APIs; its
local-only hook is injected by Node and is absent from normal/cloud responses.

Every request rechecks the persisted active user, organisation, membership,
Chambers assignment and licence. App roles come from that assignment, independently
of global Owner/Advocate/Clerk or platform Super Admin status. Client memberships
cannot enter staff APIs. Expiry grace permits reads only; suspended/revoked
licences deny access. App Owner permission is required for settings and recovery.

The facade joins record/file ownership on every lookup, scopes the staff directory,
and atomically inserts ownership with new records/blobs. Unknown/unowned or other
organisation IDs cannot be overwritten. Existing reference validation, CNR checks,
balance rules and hearing transactions operate against this scoped facade.
Transaction validation and mutations share BEGIN IMMEDIATE. Responses are staged
until commit. Temporary preview API requests are serialized, including auth and
administration, so a shared connection cannot interleave asynchronous transactions.
This is a conservative local architecture, not a production concurrency design.

Migration 003 under the owning app database directory adds organisation-specific
firm settings, audit and SQLite snapshots. Existing global settings/audit are
preserved. Only an explicitly mapped legacy firm's profile is copied; unscoped
historical audit is retained in full SQL recovery, not silently exposed in the new
organisation activity feed. Other orgs get their own default profile.

Backups use `chambers-organisation-backup` version 1 with organisationId. They
contain only selected records/files/profile. Restore accepts that organisation's
format, revalidates all references/payments/files and rejects IDs already owned by
another organisation (or unmapped legacy rows). Replacement clears only the chosen
ownership/records/files. Accounts, other organisations and audit remain intact.
Daily and pre-restore snapshots stay in organisation-scoped SQLite rows, included
in full offline SQL recovery. They are not currently listed in a recovery UI.

Global SQL export is denied through Chambers. All legacy private APIs, including
`/api/state`, `/api/backup.sql`, `/api/users`, and other unadapted app APIs, are
blocked in the temporary preview. Only the named own-account auth routes,
administration and organisation-scoped Chambers routes are enabled there; existing
public anonymous handlers retain their separate ownership. Explicit platform-wide
SQL recovery authorisation remains pending. Offline consistent full SQL export
already preserves all known organisation schema versions and data, excluding live
sessions.

Verification: `node --test tests/organisation-chambers.test.js` uses prepared,
disposable temporary databases/servers. It covers two distinct workspaces with
matching CNRs, scoped state/settings/staff/audit, guessed IDs/references/files,
licence/revocation/grace, global-route denial, concurrent payment overbooking,
atomic hearing failure/success, scoped restore/collision rollback, SQL recovery
and a version-two to version-three mapped-profile upgrade.

Frontend selection, scoped workflows, grace and revocation have browser coverage;
see `apps/advocate/tests/platform.spec.js`. Existing-account sign-in is supported.
Next: new-account onboarding and explicit Super Admin recovery controls. D1/SQL
Server adapters, production cutover and other private apps remain separate.

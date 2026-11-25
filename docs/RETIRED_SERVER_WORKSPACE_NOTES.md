# Historical server workspace notes

These October 2026 preview checkpoints document superseded contracts. See [Architecture](ARCHITECTURE.md) for current ownership and [the cutover record](ORGANISATION_PRODUCTION_CUTOVER.md) for production evidence.

Tournament Lite originally used organizer-owned SQLite snapshots, app access
for Owner and Advocate, and public published-token views. The later D1 version
added scoped licences and assignments using migration 0006. See the historical
[Tournament organisation setup](TOURNAMENT_ORGANISATION_SETUP.md).

BatchFee Lite originally had an owner-only Node workspace with SQLite snapshots,
append-only command history, optimistic revisions and idempotent request IDs.
The later D1 version added scoped academy/events, roles and recovery. Historical
SQL supports offline recovery, and the browser app accepts compatible old JSON
backups into an empty workspace.

## Former deployment and migration notes

Free cloud target (2026-10-11): `wrangler.free.jsonc` and `wrangler.free.production.jsonc` use D1 without R2, existing email/password authentication (`packages/auth/edge.mjs`), a 49-statement full-app request budget (45 in reduced mode) and atomic SQL capacity triggers. No OTP or email ownership verification is required. Optional Access authentication remains explicitly selected by `AUTH_METHOD=access`; it is not the chosen deployment mode. Chambers retains business validation, app roles and preferences. `packages/storage/d1.mjs` stores private document BLOBs with SHA-256 verification, limited to 1 MB each and 100 MB total; document bytes, metadata and audit commit atomically. `FULL_APPS=true` enables DIGITAL SAMAJ, BatchFee, Tournament, saved News, private Fund workflows and the ritual calendar. Samaj photos and message attachments share the D1 document byte cap; migration 0004 adds their private BLOB table. Staged Samaj operations use request-local projections and final atomic table batches to fit the Free query limit. Large interactive backup/restore stays disabled; verified offline D1 recovery remains available. Full recovery bundles and original runtimes remain preserved. Workers Free is owner-confirmed; deployment evidence lives in the functionality ledger. See [scope and deployment prerequisites](CLOUDFLARE_FREE_DEPLOYMENT.md).

This is an npm workspace monorepo. The retained local deployment shares one Node API and uses `(localdb)\MSSQLLocalDB / SushantSynapsePlatform`, with `platform`, `chambers`, `batchfee`, `samaj`, `tournament`, `news`, `fundlens` and `satire` schemas. Production uses `server/edge-index.mjs` on Cloudflare Workers and the `PLATFORM_DB` D1 binding, including Arena and private Chambers document BLOBs. Private APIs never fall through to the laptop. Cloud writes are authoritative after cutover and are not synchronized back to SQL Server. SQLite is retained for isolated compatibility tests and source recovery. See `docs/SQLSERVER_MIGRATION.md` for the preserved local runtime.

The 2026-10-09 additions register `apps/batchfee-lite/database/002-staff.sql` and `apps/digital-samaj/database/003-events.sql` through their owning handlers. Schema text contains DDL; migration-marker inserts run separately, so full SQL exports do not insert the same marker twice. Hearing-preparation templates create ordinary case-linked Chambers tasks through validated, transactional APIs. Timetable absence plans are separate, temporary cover sheets and do not replace its explicitly device-owned weekly setup. See `docs/PLATFORM_AUDIT_IMPLEMENTATION.md` for complete scope and operational limits.


Organisation readiness (2026-10-17): `tests/organisation-readiness.test.js` exports
from a prepared fixture and starts a second guarded runtime from a restored,
new temporary SQLite database. The shared test fixture accepts recovery SQL only
for this disposable test path; no application restore endpoint or production
startup behaviour changes. `docs/ORGANISATION_READINESS.md` records verification
boundaries and activation blockers. `npm run test:organisation-readiness` runs
the organisation suites independently of production configuration.

Organisation audit viewer (2026-10-17): admin owns `backend/audit.mjs` and guarded
audit HTML/module. Repository governance authority is re-read before scoped,
parameterised keyset queries. Details are projected through known fields/actions;
private record/credential payloads are excluded and common credential-shaped reason
text masked. UI is read-only with IST labels and lifecycle revalidation. Global
null-org audit events now use a separate Super Admin-only platform query and
guarded /platform-audit page. Shared bounded pagination, separate action allowlists
and explicit recovery flag projection preserve scope boundaries. No public/cloud route/schema.

Own-account security UI (2026-10-17): guarded My account uses the existing shared
auth password endpoint and its session rotation semantics. Password fields reset
on outcomes/visibility changes; account request revisions prevent obsolete results
repopulating DOM. Expired account sessions return to inline sign-in; client pages
link back to My account. No auth/schema/provider or public route change.

Client portal screens (2026-10-17): Chambers owns guarded client-portal HTML/module.
The client read service exposes a shared eligibility scope helper so account
navigation uses the same live entitlement/link rules. Client-link UI manages
separate Client-role assignments and displays seat impact and release fields.
Client page is read-only, clears on visibility/pagehide and rejects stale responses.
No new schema, public/cloud routes, document or financial endpoints.

Client portal API (2026-10-17): Chambers owns `client-portal.mjs`, dispatched only
in guarded preview under `/api/client-portal/:org`, separately from staff routes.
It rechecks session identity, Client membership, Client-role app assignment,
licence and explicit client links in a consistent read transaction, projecting an
allowlist of client names/basic cases. The existing ClientAccessAdministration
service owns audited Client entitlement admission to the licence's separate
client-seat pool. No migration, client UI, documents or financial routes yet.

Client-link management screen (2026-10-17): Chambers owns client-access HTML/module,
served only through guarded preview assets. My account derives link-management
eligibility from primary membership and Owner entitlement; the scoped service
independently enforces it. Overview data is restricted to member/record choice
labels and link metadata. Grace is read-only; visibility/BFCache revalidate. No
client portal reads or default/cloud route are introduced.

Client access foundation (2026-10-17): Chambers owns migration 005 and
`client-access.mjs`, with guarded staff endpoints under `/api/chambers/:org`.
Link management requires primary Master Admin plus Chambers Owner, without Super
Admin record bypass. Composite foreign keys prevent cross-org record links.
Scoped JSON restore removes link authority and audits the removal; full SQL
recovery retains it. No client read endpoints/UI/entitlement activation exist yet;
stored links alone must never become a read authorisation decision.

Organisation lifecycle (2026-10-17): the shared administration service owns explicit
Active/Suspended transitions with Super Admin, version, typed scope and audit
enforcement. Guarded admin adapters render only the next allowed action. Scoped
app/admin/invitation access re-read org status, so existing sessions are blocked on
their next request. Transitions preserve data/configuration and do not extend
licence/invitation validity. Draft/PendingActivation/Closed transitions remain separate.

Organisation account navigation (2026-10-17): `/account` is preview-only and uses
the shared admin shell. `apps/admin/backend/account.mjs` returns only the session
identity's memberships and derives Chambers links using the shared entitlement
policy plus staff-role enforcement. Membership is separate from app assignment;
Super Admin grants no automatic app access. Management links preserve org scope;
the initial admin load validates it. Visibility/BFCache revalidate account metadata.
Clients have no portal destination until one is implemented. No public/cloud route.

Super Admin full recovery export (2026-10-17): guarded admin route delegates to
Store.exportSql with an internal beforeExport audit callback inside its existing
transaction. Full backup authority is explicit and separate from business API
access. Password re-entry, full-scope confirmation, reason and bounded attempts
protect the local preview download. Sessions are excluded, and restoration stays
offline into a new empty SQLite database. No cloud/default-runtime exposure.

New-primary onboarding service foundation (2026-10-17): opt-in migration 004 tracks
invitation-created identities separately from existing disabled accounts. The
repository atomically provisions an inactive identity and primary invitation, then
activates identity/member/org with recipient credentials. It creates no app grants
or global Owner authority. Guarded preview now exposes one signed-out activation
endpoint with bounded body/attempt limits, plus activation and sign-in forms on
administration entry pages. Default/cloud runtime remains unavailable; see the
organisation continuation plan for remaining work. Scoped staff/client onboarding
now lives in `organisation-administration.mjs`: invitation-only inactive identities,
separate seat pools and atomic credential/member activation. Multiple pending org
invitations share one identity; only the first activation establishes credentials.
Later invitations use signed-in acceptance. Both activation routes share one
bounded attempt bucket and remain unavailable outside the guarded preview.

Organisation/licensing programme (2026-10-17, local foundation only):
`docs/ORGANISATION_LICENSING_PLAN.md` records approved requirements and continuation
status. Runtime-neutral `packages/auth/organisation-policy.mjs` separates platform
provisioning, primary Master Admin management, private app entitlement checks and
staff/client seat admission. Opt-in SQLite persistence/provisioning lives in
`packages/database/organisation-repository.mjs`, with ordered SQL under
`packages/database/migrations`. The shared baseline schema links this extension
without applying it on startup. Caller-owned native SQLite transactions enforce
primary Master Admin membership, hashed activation invitations, audit and revision
checks. Migration `002-legacy-chambers.sql` and `legacy-chambers-mapping.mjs`
prepare explicit account selection and legacy record/file ownership without
rewriting business rows. `organisation-schema.cjs` shares the immutable migration
manifest with `organisation-recovery.cjs`; full SQLite export includes known
organisation schema/state inside one consistent transaction. JSON restore remains
single-workspace and is not organisation recovery. No provisioning/mapping routes,
live schema/data migration or business-record tenant isolation are introduced.
SQL Server/D1, scoped restore and ongoing ownership writes remain pending.
Implementation is local only; deployment is explicitly prohibited by the user.

Chambers frontend scope (2026-10-17, guarded preview): Node injects local-only
`organisation-preview.js`/CSS before the existing controller. The controller
validates organisation selection, prefixes business/download/recovery paths and
uses trusted scoped/read-only/admin capabilities. Scoped settings excludes global
team/SQL recovery. Existing-account sign-in is available on the Chambers entry.
Switching reloads the document; visibility/BFCache revalidate, and request revisions
prevent stale responses restoring content after denial. Normal runtime/cloud
behaviour is unchanged; new-account onboarding remains pending.

Chambers scoped API (2026-10-17, temporary preview only): app-owned
`organisation-routes.mjs` injects `OrganisationChambersStore` into the existing
validated business handler. Explicit `/api/chambers/<org-id>/...` paths scope every
record/file/staff/settings/audit access and atomically persist ownership. App-owned
`003-organisation-workspaces.sql` adds profile, activity and SQLite recovery
snapshots; the shared ordered manifest/export supports all three schema versions.
Scoped JSON restore cannot clear another org or overwrite its IDs; full SQL export
is denied through Chambers. Preview serializes API requests on its shared SQLite
connection and blocks legacy private API fallthrough. Default runtime/cloud and
Chambers frontend routing remain unchanged. See the app's ORGANISATION_SCOPE.md.

Administration UI/adapters (2026-10-17, temporary preview): `apps/admin` owns the
shared browser/controller/CSS, local asset allowlist and session-authenticated Node
adapter; `apps/super-admin` owns its primary entry page. Pages and API are disabled
by default and absent from public/cloud exports. ORG_ADMIN_PREVIEW=1 requires
NODE_ENV=test/development, loopback requests/binding, SQLite and an explicitly
prepared DATA_DIR resolving under the OS temp directory. No automatic schema or
account bootstrap. Server composition injects the retained native SQLite connection
only behind this guard. Real workspace/app access is not migrated or tenant-isolated.

Organisation administration services (2026-10-17, local):
`packages/database/organisation-administration.mjs` owns primary Master Admin
transfer, manual licence lifecycle/seat limits, existing-identity member invitations,
scoped member deactivation, Chambers staff assignment and safe overview metadata.
Services use immediate SQLite transactions, persisted authority, organisation/licence
revisions and audit. No account-global role/session changes, new migration, UI or
runtime route is introduced. Other app assignment roles remain app-owned/pending.

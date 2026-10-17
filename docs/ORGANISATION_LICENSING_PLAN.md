# Organisation, user and app licensing programme

Last updated: 2026-10-17 (Asia/Kolkata).

## Resume here

**Production is now active (2026-10-17).** Read
`docs/ORGANISATION_PRODUCTION_CUTOVER.md` for the deployed D1 boundary, exact release,
verified cutover and remaining features. Worker
`71146d50-e086-48d3-b29d-87c72bf193f6` (implementation commit `dcb843b`) enables
organisation mode; the committed source republish passed 339/339 checks and live
verification without another migration or bootstrap. The requested
`superadmin@sushantsynapse.com` account exists and live sign-in is verified.
Existing four accounts and twenty records were preserved; their Owner is retained
as primary Master Admin. Super Admin has no Chambers business assignment.
339/339 full checks and live verification passed. Do not repeat bootstrap, delete
data, rerun the legacy mapping, or roll back to unscoped APIs. Private recovery
artifacts are ignored under `.publish/`. Never record the temporary password.
Next: organisation-scoped D1 recovery/snapshot capabilities, or another private
app's tenant adapter, as a separately verified increment. Other private apps and
additional client data remain unavailable. The prior foundation checkpoints below
are historical; their no-deployment and Node-only statements are superseded here.

## Historical authorisation and preview milestones

User authorised implementation after requirements refinement. Latest direction at that checkpoint:
existing data may be deleted if necessary and deployment is authorised only when
confident in readiness. This supersedes the earlier absolute no-deployment request;
it does not establish readiness. Preserve data until a concrete cutover needs it.
Requested initial identity: `superadmin@sushantsynapse.com`, not yet created.
Do not put the supplied temporary password in source, logs or documentation.
Production configuration uses Cloudflare Workers/D1, while this programme currently
supports only guarded Node/native SQLite. Prioritise a production D1 adapter and
authenticated tenant-routing integration, isolated D1 tests and verified cutover
before deployment or account creation in the production database. Do not merely
remove preview guards, expose static administration pages or migrate local SQLite
and describe that as production activation. Snapshot UI below is lower priority.
Read this file, AGENTS.md, ARCHITECTURE.md, FUNCTIONALITY_LEDGER.md and README.md
before continuing. Check git status: unrelated edits may already exist.

Current milestone: shared policy, opt-in SQLite provisioning, explicit legacy
Chambers mapping, full SQLite recovery, Master Admin/member management and licence
services implemented and tested. Administration/provisioning now have authenticated
Node route adapters and responsive local preview screens, disabled by default and
restricted to prepared OS-temporary SQLite workspaces. Legacy ownership mapping
remains offline; cloud/public serving is unchanged. Existing full SQL export
now includes organisation extensions when present, within a consistent transaction.
Existing login, Owner authority and single-workspace app behaviour are unchanged.
No live database migration, live Super Admin selection or provisioning was performed.

New primary and staff/client identity services and guarded HTTP/UI onboarding are
implemented. Explicit Super Admin full recovery export is implemented in guarded
preview (see checkpoint below). Organisation-aware account navigation is now
implemented in the guarded preview. Super Admin suspension/reactivation controls are
implemented too. Client-to-record link persistence and guarded staff API are now
implemented, including its primary Master Admin + Chambers Owner management screen.
The minimal read-only client portal API and explicit client entitlements are now
implemented, including the administrator's entitlement controls and read-only
client-facing screen. My account exposes the portal only after live eligibility
checks. Own-account password change and session-expiry recovery are implemented,
with client multi-org navigation verified. The scoped organisation audit viewer is
implemented, as is separate Super Admin-only platform audit history. The local
readiness review and restored-runtime recovery drill are now implemented; see
`docs/ORGANISATION_READINESS.md`. Next action: organisation-scoped, read-only
snapshot list/download for a currently authorised Chambers Owner, using existing
SQLite snapshots and live access checks. Do not add automatic restore or a new
overwrite/import endpoint. Runtime activation remains disabled.
Keep global and selected-organisation history separate. No private record access
or recovery download is implied by viewing audit metadata.
Keep additional client data
(hearings, documents and finances) unavailable until separate release rules exist.
Client membership alone must never match
records by name/email or expose staff APIs. Keep Closed/Draft transitions unavailable
until retention/activation rules are defined. Offline restore verification remains required;
no web overwrite/import control is authorised by this increment. Keep runtime
activation guarded and local only.
Do not create new
global accounts through legacy auth until single-workspace data exposure is closed.
Do not expose multi-organisation app access until that app's complete record,
document, search, report, export and recovery surface is scoped and tested.

### Local readiness and recovery restart checkpoint (2026-10-17)

`docs/ORGANISATION_READINESS.md` now records evidence and activation blockers across
provisioning, seats, role changes, isolation, clients, audit and recovery. Added
`npm.cmd run test:organisation-readiness` for the organisation suites. The new
restart drill restores a password-verified full export into a fresh temporary
SQLite database and starts a second guarded runtime. It verifies fresh sign-in,
source-cookie rejection, private record/document bytes, org isolation, revoked
membership and suspended licence persistence, audit and legacy-route blocking.
The original fixture remains operational. The shared test fixture's recovery path
does not add or change an application restore endpoint.

Verification: **88/88 organisation checks**, **334/334 full Node/API checks**,
**1/1 administration Chrome smoke**, syntax/whitespace pass. Logs:
`.publish/organisation-readiness-drill.log`, `.publish/organisation-readiness-suite.log`,
`.publish/organisation-readiness-full.log`, `.publish/organisation-readiness-browser.log`.
No UI feature changes; browser smoke verifies existing fixture compatibility.
No live data access/change, live migration, runtime restart or deployment. No claim
of verified live backups or production readiness. Next: scoped snapshot list/download
as described in the resume section and readiness review, with no automatic restore.

### Platform audit checkpoint (2026-10-17)

Guarded `GET /api/organisation-admin/platform-audit` and `/platform-audit` now
provide Super Admin-only history for null-organisation events. Authority is
re-read before pagination validation. The Super Admin console links to this page;
Master Admin/staff cannot read it. Organisation history remains separately scoped.
Both queries share bounded descending-ID pagination and strict parameter validation,
with separate action allowlists. Bootstrap details are empty; recovery export
metadata allows only masked reason, AllOrganisations scope and boolean inclusion/
exclusion flags. Unknown events have a generic label and no raw details. Viewing
history never creates an audit event, downloads a backup or grants private app access.

The page reuses filter/older/refresh controls, IST dates, escaped rendering,
visibility/request-revision clearing and expiry guidance. It rejects an organisation
selection on the platform page. Export creation does not prove delivery or restoration.
No migration, live runtime changes or deployment; routes remain unavailable by default.

Verification: 333/333 full Node/API checks, focused audit API 5/5 and default-guard
API 3/3 pass. Initial Chrome run passed 15/16: the new test expected a generic denial
while the API correctly returned Super Admin required; assertion corrected. Final
platform/account Chrome rerun passed 8/8; the other eight unchanged administration
Chrome workflows passed the initial run. Includes real
fixture recovery-export metadata, filtering, expiry and 320/390/768/1440px light/dark
layout checks. `.publish/platform-audit-mobile.png` visually reviewed. Fixtures use
only disposable OS-temporary databases. Next: local-preview readiness review and
explicit activation blockers, with no deployment or live migrations.

### Scoped organisation audit checkpoint (2026-10-17)

`GET /api/organisation-admin/organisations/:org/audit` reuses current repository
authority checks on every request: Super Admin may select any org; primary Master
Admin may review their own active org. Staff/Client/other-org access fails. A
suspended org remains reviewable only by Super Admin. Authorisation precedes
query validation. Reads do not write events or grant Chambers access.

Pagination is descending event ID with exclusive before cursor, default 20/max 50,
plus an allowlisted action filter. Positive safe integers, duplicate parameters
and unknown parameters/actions are validated; SQL is parameterised. New events
do not shift older pages. Response exposes ID/time/actor ID/action plus whitelisted
change metadata, not raw audit JSON. Client record IDs/names, fingerprint hashes,
tokens, password/credential fields, unknown nested values and business records are
excluded. Licence/seat/state/role changes remain readable. Unknown actions display
a generic label and no detail. Reasons are administrator-entered governance text;
common hex-token, credential-label, quoted-secret and bearer patterns are masked
before truncation. This is pattern masking, not a general classifier of free text.

Guarded `/organisation-audit?organisation=<id>` opens from administration with
explicit scope, action filter, older-page button and refresh-latest. Dates show
IST; change fields have readable labels. HTML escaping and token-free URLs/storage
are preserved. Pagehide/hidden visibility clear DOM, return revalidates, and request
revisions prevent obsolete successful reads painting after newer state changes.
Expiry links back to My account. Global null-org bootstrap/full-backup audit
events are intentionally not included yet. No schema or default/cloud activation.

Verification: **331/331 full Node/API checks**, **15/15 admin/account Chrome
workflows**, final scoped API **3/3**, final audit Chrome rerun **2/2**, all pass.
Includes scope/revocation, credential/private projection, invalid query bounds,
stable pagination across insertion, filtering/empty results, expiry and Super Admin
governance without staff access. Layout checked at 320/390/768/1440px light/dark;
updated `.publish/organisation-audit-mobile.png` visually reviewed. Syntax/whitespace
checks pass. Logs are in the ledger. All fixtures disposable; no live changes,
runtime restart or deployment.

### Own-account password and session recovery checkpoint (2026-10-17)

My account offers Change your password for every active signed-in identity, including
Clients and staff without app assignments. Uses only the existing `/api/auth/password`
own-account endpoint: current password verification, 12–128 character new password,
confirmation match in the UI, and server-side validation. No administrator reset,
role changes, public registration or new auth endpoint is introduced. Existing
endpoint invalidates old sessions and issues a fresh cookie to the current browser.

Inputs clear after success, incorrect password/mismatch and pagehide/hidden
visibility. No credentials enter URLs, business state or browser storage. Busy
submission guards prevent duplicate saves. A response received after page scope/
visibility has changed cannot repopulate the account DOM. Other authenticated
sessions receive an explicit expiry/sign-in message on their next request and
private account DOM is cleared. My account supports reauthentication through its
existing sign-in form. Client portal and link-management pages direct expired
sessions to My account; they retain their existing denial/DOM-clearing behaviour.

Client multi-org browser coverage explicitly provisions separate licensed Client
assignments/links, navigates each account destination and verifies case data never
mixes. Client membership/record matching remains explicit; staff APIs remain denied.
No auth implementation, persistence schema, default/cloud activation or live data
changes in this increment. Verification: **328/328 full Node/API**, **12/12 account/
client Chrome workflows**, final focused rerun **3/3**, all pass. Includes incorrect
password/mismatch/clearing, other-session expiry and reauthentication, current-session
renewal, client two-org isolation and portal expiry. Password layout checked at
320/390/768/1440px in light/dark; mobile screenshot visually reviewed. Syntax/
whitespace checks pass. Logs are in the ledger. No live changes or deployment.

### Read-only client portal screens checkpoint (2026-10-17)

Preview-only `/client-portal?organisation=<id>` renders approved client names and
basic own-case number/CNR/court/stage/status. No edit, upload, document, staff,
hearing or financial controls are provided. It uses the same no-store read API,
preserves explicit scope and links back to My account for sign-in/sign-out and
navigation. Read-only grace is labelled. Pagehide/hidden visibility clears DOM;
visibility/BFCache return revalidates and request revisions prevent old success
responses repainting after newer denial. No business data is stored in browser
storage. This is a guarded temporary preview, not a production client portal.

Client-link management now shows client-seat usage/allowance, current Client app
assignment status and explicit Enable/Revoke controls with reason/version checks.
The administrator sees the exact released field list and exclusions before enabling
access. Links and entitlements remain separate approvals; revoking links alone
does not release reserved app seats. Zero client seats rejects activation, and
grace disables all mutations. Inactive past assignments remain available for
explicit revocation even when the target is no longer an eligible new member.

`clientPortalScope` is shared by account metadata and portal reads, checking live
membership, role/assignment, licence/client pool and approved current links without
loading cases for account eligibility. My account shows Open client portal only
for eligible Client memberships, otherwise explains missing approval without
exposing records. Ordinary Chambers links remain unavailable to Client members.
Default/cloud assets remain unregistered; no schema or production changes.

Verification: **328/328 full Node/API checks**, **4/4 Chrome link/portal workflows**
pass. End-to-end workflow includes link approval, zero-seat denial, seat allocation,
entitlement activation, client account navigation, minimal field display and
revocation. A held old response is released after a newer denial and cannot restore
DOM data. Layouts checked at 320/390/768/1440px in light/dark; mobile screenshot
`.publish/client-portal-mobile.png` visually reviewed. Syntax/whitespace checks pass.
Logs: `.publish/client-portal-ui-tests.log`,
`.publish/client-portal-ui-browser-final.log`. No live data changes or deployment.

### Read-only client portal API checkpoint (2026-10-17)

Preview-only `GET /api/client-portal/:organisationId` has a separate dispatch path
from Chambers staff APIs. Actor comes exclusively from the session and org from
the route. One consistent read transaction rechecks active identity, active Client
membership, active organisation, explicit active Chambers assignment with app role
Client, valid licence/client pool, and active explicit links to unarchived same-org
client records. Super Admin/staff authority alone never grants access. Query/body
scope cannot choose another identity. Writes are 405; child file/record routes do
not exist. Ordinary staff APIs still reject Clients even with this assignment.

The exact response allowlist is organisation ID/name, readOnly=true, licence mode,
linked client ID/name, and related case ID/clientId/number/CNR/court/stage/status.
Cases must be unarchived and owned by that same organisation with a clientId in
the approved linked-client set. Values are projected as strings, never nested raw
objects. No case titles, notes, hearings, fees, invoices, payments, staff users,
email/contact details, documents or audit are released. Licence grace permits only
this read-only response; expiry outside grace, suspension, archived client, revoked
link, disabled user/membership or revoked entitlement deny existing sessions on
their next request. No live court-sync claim is introduced.

`POST /api/chambers/:org/client-entitlement` uses the link service's primary Master
Admin + writable Chambers Owner authority, exact org revision and required reason.
Active requires an active Client member and an approved current record link. It
creates an explicit advocate app assignment with role Client. Each active assigned
member consumes one licence client seat independently of staff seats; zero grants
none, null is unlimited. Existing admission/limit rules count reservations
conservatively and reject reductions below assignments. Assignment, version and
`ClientEntitlementUpdated` audit commit atomically. Inactive releases the seat and
can be set after links are revoked. Link revocation/organisation JSON restore blocks
reads but does not silently release this separate assignment; explicitly deactivate
it to release its reserved seat. Full SQL recovery preserves both links/assignment.

No migration or UI changes in this checkpoint. Client portal/entitlement controls
are API-only and the account page still marks the screen unavailable. Before UI
activation show administrators the release field list and seat impact. No documents,
hearing/financial endpoints, public registration, delivery or production integration.
Verification: **328/328 full Node/API checks**, **5/5 focused portal checks** pass,
including field projection, own-client scope, client-seat limits, role/revision/link
checks, existing-session revocation, audit rollback, grace/expiry, full recovery and
scoped restore. Syntax/whitespace checks pass; no browser rerun for this backend-only
increment. Logs: `.publish/client-portal-tests-final.log`,
`.publish/client-portal-api-final.log`. No live data, migration, restart or deployment.

### Client-link management UI checkpoint (2026-10-17)

Preview-only `/client-access?organisation=<id>` uses Chambers-owned HTML/module and
the existing scoped link service. My account exposes the destination only for the
primary Master Admin with current Chambers Owner read access. Direct requests still
enforce the full server-side policy; Super Admin status alone never bypasses it.
The selected organisation is explicit and never silently replaced by another.

The service overview now returns eligible active Client members (ID/name/email),
unarchived owned client choices (ID/name), existing link labels/status and read-only
mode, within its checked transaction. Internal client notes/full records and other
org clients are excluded. Existing links retain labels for revocation even if the
target membership is no longer eligible for a new grant.

The screen grants/revokes with required reasons and the current org revision.
During grace it permits viewing but disables mutations. Busy writes prevent double
submissions; conflicts retain entered reason and require explicit refresh. It clears
record/member DOM on pagehide/hidden visibility and revalidates on return/BFCache;
response revisions reject obsolete successful reads. Tokens/business data are not
stored in browser storage. Portal remains visibly unavailable. No migration needed.

Verification: **323/323 full Node/API checks**, **3/3 new Chrome workflows** pass.
Includes grant/revoke, own-org minimal choices, Super Admin/direct-scope denial,
stale revision and grace controls. Layouts checked at 320/390/768/1440px in light/
dark; `.publish/client-links-mobile.png` visually reviewed. Syntax/whitespace pass.
Logs: `.publish/client-links-ui-tests.log`, `.publish/client-links-browser-final.log`.
All tests used disposable fixtures; no live data change, restart or deployment.

### Client access link foundation checkpoint (2026-10-17)

Chambers-owned opt-in migration 005 adds `chambers_client_access`, linked by
composite foreign keys to the same organisation's membership and `clients` record
ownership. Multiple explicit client records may be linked to one membership;
there are no inferred email/name matches. Status is Active/Revoked with timestamps.
Migrations 001–004 are unchanged; checked upgrades and full recovery support old
version-four exports and new link rows. No live migration is applied on startup.

`apps/advocate/backend/client-access.mjs` owns transactional link administration.
`GET/POST /api/chambers/:org/client-access` requires the organisation's primary
Master Admin AND active licensed Chambers Owner assignment. Super Admin status
alone grants no record access or linking power. Reads permit existing read-only
grace; writes require writable entitlement. Grants require an active global user,
active Client membership and non-archived owned client record. Revocations can
remove a prior link after the target membership becomes inactive. Exact org
revision and reason are required; link, version and `ClientAccessUpdated` audit
(actor/time/reason/record and member IDs/before/after) commit atomically. Cross-org
IDs, staff memberships, archived records, no-op changes and stale writes fail.

Scoped JSON backup/snapshots omit access authority. Restoring organisation data
cascades deletion of client links, increments the org version and audits
`ClientAccessClearedForRestore`; the confirmation dialog explains reapproval.
Links cannot silently rebind to restored records with reused IDs. Full platform
SQL recovery preserves them; foreign-key integrity and exact roundtrip are tested.

This is an administration foundation, NOT a client portal or app assignment.
No client read endpoints, client licence-seat activation or documents/cases/fees
are exposed. Client accounts still see portal unavailable and cannot enter staff
APIs. Before portal reads, require live user + Client membership + organisation +
explicit active link + client entitlement checks on EVERY request. Related cases
must belong to the linked client and same org; use field allowlists and exclude
staff notes, financial internals, audit, assignments, other clients and documents
until explicit release rules exist. Archived records and inactive/revoked links
must fail closed. Do not infer access from a stored link alone.

No link UI is added yet. Verification: **323/323 full Node/API**, **5/5 focused
client-link checks**, **4/4 scoped Chambers Chrome workflows**, all pass.
Includes role/tenant denial, disabled/archive/revision validation, audit rollback,
SQL roundtrip and scoped-restore authority clearing. Syntax/whitespace checks pass;
logs are in the ledger. All work uses disposable fixtures. No live database/account
change, restart or deployment.

### Organisation lifecycle checkpoint (2026-10-17)

`OrganisationAdministration.updateOrganisationStatus` implements only Active ->
Suspended and Suspended -> Active, in one SQLite transaction with current Super
Admin authority, exact org version, exact organisation-name confirmation and a
required reason. No-op, Draft, PendingActivation, Closed and unknown transitions
are rejected. Status change, version increment and `OrganisationStatusUpdated`
audit (actor, timestamp, reason, before/after status) commit or roll back together.

The guarded `POST /api/organisation-admin/organisations/:id/status` adapter derives
actor and scope from session/path. Super Admin forms expose only the valid next
transition; Master Admins have no lifecycle control. Existing memberships, primary
administrator, assignments, licences/dates, reservations, pending secrets, accounts,
records and documents are preserved. Suspension does not pause expiry clocks.

Suspension blocks existing sessions on their next org-scoped request: private app
reads/writes/downloads/backups, primary administration and invitation acceptance.
Own-account authentication, other organisations and Super Admin governance remain
available. Account metadata shows Suspended and no valid app/management links;
pages revalidate on refresh/visibility return, without a server-push clearing claim.
Reactivation does not renew licences, activate identities/memberships, assign apps
or revive revoked invitations. Every existing entitlement check still applies.
An unexpired pending invitation becomes usable again after reactivation; expired
ones still need explicit reissue. No new migration/default/cloud activation.

Verification: **318/318 full Node/API**, **13/13 admin/account Chrome**, **24/24
focused service**, **1/1 focused lifecycle API** pass. Includes rollback, stale
revisions, unsupported transitions, existing-session denial, independent licence
enforcement, other-org continuity and preserved invitation acceptance. Mobile form
screenshot reviewed; syntax/whitespace checks pass. Logs are in the ledger.
No deployment, live schema/account/data changes or live runtime restart.

### Organisation-aware account navigation checkpoint (2026-10-17)

Preview-only `/account` reuses the administration shell with a self-service
`GET /api/organisation-admin/account` endpoint. The endpoint derives identity and
all scope from the session, rechecks the active account and returns only that
identity's memberships, their org/member statuses, primary administration authority
and Chambers assignment/access state. No other users, credential hashes, invitation
hashes, limits or business records are returned. Super Admin authority supplies a
platform-administration destination but no implicit business memberships/app links.

Membership cards distinguish organisation role from app role/assignment. Chambers
links require the same membership, org, staff-role, assignment and licence checks
as the scoped API; grace links are labelled read-only. Clients get an explicitly
unavailable client-portal message and never a staff app link. Unassigned members
are directed to their Master Admin. Other apps are not presented as org-integrated
until a scoped adapter exists. All app APIs remain decisive on direct navigation.

Management links include an explicit org query. Initial administration navigation
and post-sign-in navigation reject unavailable requested scope rather than silently
opening another org. Account accepts existing/new invitations and sign-in using
the existing guarded flows. Admin screens and the preview-only Chambers footer
link back to My account. Pagehide/hidden visibility clear account data/DOM;
visibility/BFCache return revalidates and response revisions reject old results.
No business state/tokens are written to browser storage. `/` and default/cloud
assets remain unchanged; `/account` is not publicly registered.

Verification: **315/315 Node/API checks**, **8/8 existing admin Chrome workflows**,
and final account Chrome workflows **4/4** all pass. Includes delayed old response
after sign-in expiry, revoked app links, scoped admin rejection, client invitation
acceptance/unavailable portal, and mobile/theme layouts. Mobile screenshot reviewed;
syntax/whitespace checks pass. Logs are in the ledger. No schema change, live
database change, runtime restart or deployment.

### Super Admin recovery export checkpoint (2026-10-17)

Recovery scope: an explicit full-platform disaster-recovery backup, separate from
normal Chambers access and organisation JSON backups. It includes all organisations,
records, exact document bytes, account password hashes, app permissions, preferences,
licences, invitations (hashed tokens), pending identities and audit. Live sessions
are excluded. It is sensitive and intended for offline restoration into a NEW empty
SQLite database. No browser restore, merge, live DB replacement, credential reset,
or Super Admin bypass of ordinary Chambers APIs is added.

`POST /api/organisation-admin/recovery-export` requires an active session and
re-read Super Admin authority, current password, reason (1–500 characters) and
literal `EXPORT ALL ORGANISATIONS` confirmation. It is preview-only, same-origin,
loopback-only, with a 4 KiB JSON limit and a shared process-local five-attempt/minute
bucket. The password is checked with the existing scrypt format and never audited
or included in URLs. The shared Store SQL exporter accepts an internal callback;
the callback inserts `PlatformRecoveryExportCreated` (actor, timestamp, reason,
scope and inclusion metadata) inside the export's SQLite transaction before its
consistent snapshot. Audit and export creation fail together. Successful creation
does not prove the recipient saved the file or restored it. Responses are attachment
downloads with no-store/nosniff headers; no server-side backup file is written.

Super Admin screens expose a dedicated recovery form with full-scope explanation,
password re-entry and confirmation. Password field clears after any response and
on pagehide. Downloads use transient object URLs revoked after dispatch. Master
Admins never see this form. A wrong re-entry password clears the field while
preserving the authenticated workspace for retry; actual authority loss still
hides the workspace. No new schema/migration is needed. Verification: **313/313
full Node/API checks**, final recovery API **2/2**, final admin Chrome workflows
**8/8**, all pass. Includes offline restore roundtrip, exact blobs, session
exclusion, rollback/rate checks and mobile/theme layouts. Updated recovery form
screenshot visually reviewed; syntax/whitespace checks pass. Logs are recorded
in the ledger. No live data or deployment changes.

### New staff/client onboarding checkpoint (2026-10-17)

`OrganisationAdministration.inviteNewMember` authorises the session actor and checks
org revision before identity lookup/creation. The existing invite route explicitly
selects an existing active identity or a new/pending identity. Only tracked,
unactivated inactive identities can be reused; genuine disabled accounts and active
accounts cannot be reset. Identity creation, membership, token, reservation, org
version and audit share one transaction. Staff/Administrator reserve staff seats;
Client reserves client seats. Same-pool reissue does not double-count, pool changes
check destination capacity, and expired invitations reserve seats until revoked.
Revocation releases only that membership seat and leaves other org invitations
intact. Explicit reissue after revocation can reuse the pending identity.

`POST /api/organisation-admin/activate-new-member` shares the existing preview
guards, signed-out requirement, 4 KiB limit and shared 20 attempts/minute bucket
with primary activation. Token/email/pending identity/member/org state and capacity
are checked before hashing. Identity credentials, activation, membership, token
consumption and audit commit atomically. No app assignment or global authority is
granted. Staff require explicit licensed app assignment; Clients cannot receive
Chambers staff assignments and the client portal remains unimplemented.

Multiple org invitations may reference the same pending identity. The first valid
activation establishes credentials and activates only its target membership. Other
invitations must then be accepted while signed in as that identity; they cannot
reset credentials. Primary provisioning still rejects an already-existing pending
email; the member flow can reuse a pending identity created by primary provisioning.
All tokens remain bearer secrets, manually shared; delivery is not connected.

Both admin pages offer new/pending member invitations and the signed-out activation
form selects primary versus staff/client invitation. Existing-account flows remain.
No new migration is needed beyond opt-in 004. Verification: **311/311 Node/API**,
**7/7 admin Chrome workflows**, **22/22 focused administration service checks**
pass. Includes competing-connection last-seat admission, pool conversion,
revocation/reissue, expiry/rollback, multi-org pending identity activation and
client staff-app denial. Updated mobile activation screenshot visually reviewed;
syntax/whitespace checks pass. Logs are recorded in FUNCTIONALITY_LEDGER.md.
All work remains local; no deployment or live database/account changes.

### New primary HTTP/UI checkpoint (2026-10-17)

Super Admin provisioning explicitly selects existing active account (default) or
new account. `POST /api/organisation-admin/activate-new-master` is the sole new
unauthenticated route, only within the loopback, disposable SQLite preview.
Existing host/origin/cross-site checks run first. It accepts at most 4 KiB JSON,
uses one bounded process-local bucket of 20 attempts/minute (all attempts counted),
and validates invitations before password work. Token failures are generic;
signed-in callers must sign out first. No auto-login or session replacement occurs.
The bucket is intentionally shared across clients and resets on process restart.

Both administration entry pages provide sign-in and new-primary activation forms.
Recipient enters secret, invited email, name and a 12–128 character password, then
signs in normally. Signing in from `/super-admin` goes to `/admin`; Super Admins
can still navigate to their platform page. Passwords/secrets are not stored in
URLs or browser storage; forms clear on success/pagehide. Sign-out clears displayed
workspace state. New primary membership confers administration only; app assignment
remains explicit. Invitation delivery is still manual and not connected.

Verification: **303/303 full Node/API checks**, **5/5 admin Chrome workflows**,
plus the strengthened new-primary browser rerun **1/1**, all pass. Activation
layout checked at 320/390/768/1440px in light/dark; mobile screenshot reviewed.
Syntax/whitespace checks pass. Logs are linked in FUNCTIONALITY_LEDGER.md.
All tests used disposable workspaces. New staff/client
onboarding, cross-org pending identity reuse, broader account navigation, platform
recovery controls and production adapters remain pending. No deployment/live changes.

### New primary identity foundation checkpoint (2026-10-17)

`OrganisationRepository.provisionNewMaster` is a service-only, Super Admin-only
operation. It creates a disabled Clerk identity, explicit pending-identity marker,
organisation, primary membership, licences and hashed invitation in one SQLite
transaction. Existing active, disabled or pending email identities cannot be
claimed or reset. No legacy app grants, scoped assignments or Super Admin grants
are created. `activateNewMaster` validates token, email, pending marker, expiry,
org/member state before password hashing, then atomically sets the recipient's
password/name, activates identity and primary membership/org, consumes the token
and audits. Tokens are bearer credentials distributed separately; delivery/email
ownership verification is not connected. Passwords use the existing scrypt format
and 12–128 character requirement. Activated identities cannot use this as a reset.

Migration 004 is additive and opt-in; migrations 001–003 remain unchanged. Recovery
supports old version-three exports and includes pending identity state in new
exports. Pending-primary invitations support existing Super Admin rotation and
revocation controls without enabling sign-in. New identities cannot yet be shared
across pending organisations; existing/pending email attempts are explicitly
rejected. No HTTP route, registration screen, auto-login or account delivery is
added in this checkpoint. Do not present onboarding as complete.

Verification: seven isolated in-memory SQLite checks pass, including replay,
expiry, wrong recipient, existing-account protection, transactional rollback,
rotation/revocation, credential compatibility and recovery. Full regression:
**301/301 npm.cmd test checks pass**, log
`.publish/organisation-onboarding-tests.log`. Syntax/whitespace checks pass.
No UI changes or browser rerun in this checkpoint. No live data or deployments
were touched.

## Accepted product direction

Platform -> organisations -> memberships -> app licences -> app assignments ->
app roles and record permissions. One shared login identity; membership and role
are organisation-specific. Support multiple memberships structurally, even if the
first onboarding UI uses one. Switching organisations must never merge data.

Super Admin alone creates organisations, assigns licences and assigns the initial
primary Master Admin. Provisioning is complete when an organisation, its app
entitlements and exactly one primary Master Admin are established; activation
requires acceptance of a secure expiring invitation. No public self-provisioning.

One organisation has one primary Master Admin and initially one workspace per
private app. Master Admin manages users, invitations, app assignments and delegated
app administrators within granted limits. Delegated administrators are not extra
primary Master Admins. Transfer of the primary administrator is atomic and audited.
Master Admin cannot create Super Admins or expand purchased/granted entitlements.

Super Admin controls organisation provisioning, suspension, licences, primary
administrator recovery, app implementation availability and platform operations.
Platform administration does not implicitly authorise reading private app records.
Any future support access must be explicit, scoped, expiring and audited.

Existing Owner/Advocate/Clerk roles cannot be repurposed as the full new hierarchy.
Keep platform roles, organisation roles and app roles separate. Do not promote all
legacy Owners to Super Admin. Explicit migration/bootstrap mapping is required.

## Licence and access requirements

- Organisation statuses: Draft, PendingActivation, Active, Suspended, Closed.
- Licence statuses: Scheduled, Trial, Active, Suspended, Expired, Revoked.
- Licence fields: organisation, app, start/end UTC instants, optional explicit
  read-only expiry deadline, separate staff/client seat caps, enabled features,
  resource limits, revision and audit history. Null end means non-expiring.
- Private app access requires active user, active organisation, active matching
  membership, usable app, valid matching licence, active matching assignment,
  permitted operation and server-enforced access to the specific record.
- No platform/Master Admin bypass for business APIs. App roles supply permissions.
- Public tools retain existing public access and do not require private licences.
- Planned apps cannot be activated through licences. Maintenance and Disabled are
  proposed future app operational states, not implemented catalogue states.
- One active staff member consumes one organisation staff seat. Each active app
  assignment consumes an app seat. Client capacity is a separate pool.
- Check capacity atomically at invitation reservation/acceptance, activation and
  assignment. Never reject ordinary work merely because capacity is now full.
- Renewal and expiry preserve data. Ordinary expiry may allow an explicitly bounded
  read-only period; security suspension/revocation denies access immediately.
- Start with manual licence administration; no subscription/payment provider needed.
- Invitations use hashed single-use tokens, expiry, explicit intended email and
  membership, revocation and safe reissue. Never store invitation secrets in audit.
- Deactivation affects the selected membership, not unrelated organisations. Revoke
  or revalidate affected sessions/contexts immediately after permission changes.

## App scope and order

1. Shared organisation isolation and administration foundation.
2. Super Admin provisioning and Master Admin membership/app management.
3. Chambers scoped workspace and explicit publication/sharing controls.
4. Read-only Client app: invited identity linked to client profile, selected
   matters/hearings, published documents, fee statements and recorded receipts.
5. BatchFee Lite, DIGITAL SAMAJ and Tournament Lite adoption one app at a time,
   retaining their own role semantics and organiser/public-result boundaries.
6. Client submissions/enquiries only after read access is proven safe.

Client identity is not a Chambers client record. An explicit mapping is necessary.
Internal notes, draft documents, staff tasks and unpublished information stay
private. Client APIs must return a safe projection, never full staff data hidden
by the browser. Payments, automatic messaging and court sync remain separate work.

## Technical ownership and migration

Shared identity/access: packages/auth. Shared persistence: packages/database.
Proposed app UIs/handlers: apps/super-admin, apps/admin and apps/client. App-specific
business scope stays in the owning app. Node composition: server/index.js; edge
composition: server/edge-index.mjs. Preserve / and /advocate and static allowlisting.

Source inspection: server/index.js creates the shared Chambers store; the database
constructor defaults to SQLite unless DATABASE_PROVIDER selects SQL Server.
Cloudflare has separate edge authentication/repositories. ARCHITECTURE.md describes
a D1 cloud cutover, while older README/ledger sections describe tunnel hosting.
This session did not inspect production state, start the real server or read data.
Do not infer the active production database from old documentation. Preserve
data/chambers.sqlite and data/records.json. No cloud or local runtime migration is
authorised implicitly by implementing source files.

Plan ordered additive SQLite migrations and corresponding SQL Server/D1 adapters;
keep canonical shared and Chambers schema sources. Test existing-database upgrades,
checksums/versioning and recovery. Existing baseline tables use positional INSERTs
in several runtimes; adding columns can break them. Prefer new relationship tables
until all writers and backup/export/import paths are reviewed. Never label tenant
isolation complete while legacy unscoped endpoints remain reachable.

## Milestone tracker

| ID | Milestone | Status / evidence |
|---|---|---|
| O01 | Requirements and continuation checkpoint | This document; accepted direction recorded |
| O02 | Runtime-neutral access/seat policy | Implemented in packages/auth/organisation-policy.mjs; not integrated |
| O03 | Persistence and migration design | Two ordered opt-in SQLite migrations and full SQL recovery tested; runtime, SQL Server and D1 integration pending |
| O04 | Explicit initial Super Admin and legacy org mapping | Offline bootstrap plus explicit preview/apply Chambers account/data ownership mapping tested; no live selection or mapping |
| O05 | Transactional provisioning and activation | Existing-identity provisioning/activation plus local preview HTTP/UI verified; new-account onboarding and production/cloud integration pending |
| O06 | Master Admin user/app/seat management | SQLite services and local authenticated HTTP/UI cover transfer, licences, seat limits, invitations, membership deactivation, Chambers assignment and overview; other-app assignments and production activation pending |
| O07 | Chambers organisation isolation | Preview API/frontend verified: explicit org selection, scoped workflows/downloads/restore, read-only UI, revocation/stale-response clearing; new onboarding and production adapters pending |
| O08 | Client sharing and read-only portal | Pending |
| O09 | Other private app adoption | Pending |
| O10 | UI, full security/recovery verification | Admin local preview API and four Chrome workflows verified; complete runtime tenant security remains pending |
| O11 | Deployment | Prohibited by current user instruction |

## Verification and required acceptance evidence

Focused tests: node --test tests/organisation-policy.test.js. These cover mismatched
organisation/user/app contexts, revoked assignments, planned apps, permissions,
administration separation, exact licence boundaries and staff/client seat limits.
Policy callers must supply trusted persisted context; the policy is not a record
ACL, provisioning service, seat counter or database transaction implementation.

2026-10-17 verification: focused policy tests 4/4 passed. Full npm.cmd test:
236 passed, 14 failed; all failures are tests/cloudflare.test.js setup hooks with
EPERM unlinking infrastructure/cloudflare/dist/ads.txt during generated frontend
rebuild. Local rerun log: .publish/organisation-foundation-tests.log. No generated
directory deletion or permission change was attempted. git diff --check passed.
No browser tests were needed for this policy-only increment. Resolve the generated
build permission issue before claiming full-suite verification in a later milestone.

Continuation verification (2026-10-17): **261/261 full npm.cmd test checks pass**
using elevated Windows filesystem access for generated frontend output. The
previous Cloudflare EPERM setup failures did not require a product-code fix.
Log: `.publish/organisation-provisioning-tests.log`. Final focused run:
**15/15 policy/repository tests pass**, including the final migration-constructor
guard. Whitespace checks pass; no UI/browser changes or deployment.

## Implemented persistence increment (2026-10-17)

- `packages/database/migrations/001-organisations.sql`: additive SQLite tables for
  Super Admin selection, organisations, memberships, licences, assignments,
  invitations and organisation audit. Deferred composite FK plus unique partial
  index enforce exactly one matching primary Master Admin at transaction commit.
- `packages/database/organisation-repository.mjs`: explicit migration with checksum
  tracking, transactional DDL rollback and idempotency. Accepts caller-owned native
  SQLite only, with foreign keys enabled; never opens a database path. The canonical
  shared schema links the extension but does not auto-apply it at runtime.
- Explicit one-time offline bootstrap selects an existing active identity, without
  changing legacy roles or promoting Owners automatically. This is an internal
  administrative operation, not an HTTP endpoint. Account selection remains a
  future operational step requiring an explicit identity choice.
- `provision`: re-reads persisted Super Admin authority, validates organisation
  fields, timezone, private implemented apps, licence dates and separate staff/client
  limits, and atomically writes a PendingActivation organisation, invited primary
  Master Admin membership, licences, invitation and audit. No app assignments are
  implicitly granted. Minimum organisation staff capacity is one for its Master Admin.
- `acceptInvitation`: requires the intended existing active user and unchanged email;
  validates a single-use 48-hour secret, organisation/member states and expiration.
  Atomically activates membership/organisation, consumes the invitation and audits.
- `updateMasterInvitation`: Super Admin-only revoke/reissue for pending organisations
  with optimistic revisions. Old secrets are revoked; raw secrets are returned once,
  stored only as SHA-256 hashes and excluded from audit. No delivery provider.
- `organisation`: scoped administrative metadata/licence reads for the active primary
  Master Admin or Super Admin. Does not read or grant private app business records.
- All repository actor IDs must come from authenticated server sessions when routes
  are eventually connected; never forward request-body actor IDs. Authority and
  membership are re-read, so cached repository instances do not preserve revoked roles.

Tests use newly created OS-temporary SQLite files and preserve representative legacy
accounts, records, file bytes, grants and preferences through migration. They cover
rollback after forced audit errors, database reopen, token replay/expiry/rotation,
revoked authority, two-organisation admin isolation and database constraints.

At the end of the provisioning increment, pending work included new-identity registration/activation, primary administrator transfer,
general membership/seat reservation and assignment services, licence editing and
feature/resource entitlements, contact metadata, legacy data ownership mapping,
Chambers record isolation, backup/export/import inclusion, SQL Server/D1 migrations,
server/edge integration and all administration/client UI. Do not run the opt-in
migration against existing user data before the recovery and scoping work is ready.

## Implemented mapping and recovery increment (2026-10-17)

`packages/database/migrations/002-legacy-chambers.sql` adds an explicit single
legacy Chambers workspace marker and record/file ownership side tables. Migration
001 is unchanged; the runner accepts ordered known prefixes, applies missing
migrations transactionally and rejects modified/unknown/out-of-order history.
`organisation-schema.cjs` is the shared migration/export manifest.

`LegacyChambersMapping` in `packages/database/legacy-chambers-mapping.mjs` is an
offline service. Super Admin must explicitly map or exclude every existing global
account, retain the activated primary Master Admin and preserve each assigned
account's existing Chambers app role/access. Excluded accounts keep their existing
global login/access unchanged; exclusions are not enforced by legacy app routes.
Inactive accounts create inactive memberships/assignments. Target org must have
only its primary membership, no app assignments, sufficient capacity and a current
writable Chambers licence. No implicit app-role upgrade or client conversion.

Preview returns counts and a fingerprint, without changing data. Apply recomputes
the fingerprint under an immediate SQLite transaction; changed accounts/passwords,
grants, preferences, settings, records, document bytes, target org state/licence or
mapping choices require a fresh preview. A one-time apply creates memberships,
Chambers assignments, workspace marker and record/file ownership with audit.
Audit failure rolls everything back. Existing records, files, settings, accounts,
sessions, preferences and global app grants remain byte-for-byte unchanged.

`packages/database/organisation-recovery.cjs` extends Store.exportSql for known
organisation schema versions, including roles, licences, hashed invitations, audit
and legacy ownership mappings. It rejects incomplete schema or unknown/modified
migration history. Full SQLite export runs in one consistent transaction, restores
into an empty database and excludes live sessions. Version-one foundations can also
be exported and upgraded without rewriting existing migration history. The existing
SQL Server export branch is unchanged. No cloud recovery claim is added.

Chambers JSON backup/restore remains its existing single-workspace format and does
not include organisation authority or ownership. It is not a recovery path for a
mapped multi-organisation database. The new ownership FKs can block legacy bulk
restore/deletion; scoped restore and safe export authorisation are still required
before runtime integration. Existing Owner-only full database export must be
reviewed against new Super Admin authority before multi-organisation rollout.

Verification: **269/269 npm.cmd test checks pass** (elevated Windows filesystem
access for generated Cloudflare build output), plus **23/23 focused organisation
tests**. Final focused mapping/recovery rerun **8/8 passes**, including extra
version-one recovery and partial-schema checks. Log:
`.publish/organisation-mapping-tests.log`. Diff whitespace checks pass. No UI changes
or browser run, real database access/migration, runtime restart or deployment.

No new business writes are automatically organisation-scoped: existing app routes
still read/write the original records/files directly, and new legacy writes would
not acquire ownership rows. This increment prepares migration/recovery only; it
does not establish tenant isolation. Apply it only to disposable fixtures until
app-wide scoping, ongoing write ownership and recovery integration are ready.

## Implemented Master Admin and licence increment (2026-10-17)

`packages/database/organisation-administration.mjs` adds internal SQLite services
over the existing repository; no new schema/migration or server route is introduced.

- Super Admin alone transfers the primary Master Admin to another active staff
  member of the same active organisation. The old primary becomes an explicitly
  selected Staff or Administrator member. Transfer preserves exactly one primary
  at commit, leaves app roles/global accounts unchanged and is fully audited.
- Super Admin creates/edits licences for implemented private apps, including UTC
  validity/grace windows, Trial/Active/Scheduled/Suspended/Expired/Revoked states,
  staff/client seat caps and independent licence revisions. Expired status requires
  an actual finite past end date. Renewal can restore assignment eligibility;
  suspension/revocation keeps assignments/data intact. No capacity reduction below
  existing active assignments; release assignments explicitly first.
- Super Admin edits organisation staff/client limits, including while suspended.
  Closed organisations cannot change limits/licences. Capacity cannot drop below
  active memberships plus pending invitation reservations.
- The primary Master Admin (or Super Admin) invites existing active identities as
  Administrator, Staff or Client. Invitations reserve the appropriate seat pool,
  expire after 48 hours, are hashed and are bound to user ID and unchanged email.
  Reissue revokes old secrets. Acceptance activates only the membership and grants
  no app assignment. Member acceptance has a separate method from initial primary
  Master Admin activation. No registration of a new global account is implemented.
- Pending invitations, including expired ones, reserve capacity until explicitly
  revoked or reissued. This conservative rule avoids silent seat reassignment.
  Deactivated global accounts with still-active memberships also retain seats until
  their organisation membership is explicitly deactivated.
- Member role/status edits protect the primary Master Admin. Deactivation revokes
  only that organisation's assignments/open invitations, preserving global login
  and other memberships. Reactivation or staff/client conversion requires a fresh
  invitation, and previous assignments remain inactive until explicitly reassigned.
- Chambers assignment supports explicit Owner/Advocate/Clerk app roles for active
  staff under a currently writable Chambers licence. Client memberships cannot
  receive staff Chambers roles. Other apps retain their own role ownership;
  assignment services for them are not implemented. The organisation Administrator
  role is stored but is not delegated primary Master Admin authority.
- Scoped overview returns organisation/licences, members, assignments, invitation
  metadata and seat usage without passwords, session data or invitation hashes.
  All mutations use BEGIN IMMEDIATE, fresh persisted authority, organisation
  revisions, bounded required change reasons and transactional audit. Licence edits
  also require their own licence revision (zero for creating a new entitlement).

Focused verification: **38/38 organisation tests pass**, including **15 new admin
tests** covering identity/role boundaries, reservations, expiry/revocation, capacity,
cross-org isolation, protected primary transfer, licence lifecycle, stale competing
assignments through two SQLite connections, forced audit rollback, current authority
checks and full SQL recovery with global accounts preserved. This is not a claim
of a high-throughput concurrency benchmark. **284/284 full npm.cmd test checks
pass**; log `.publish/organisation-administration-tests.log` (elevated Windows
filesystem access for generated Cloudflare output). Whitespace checks pass.
No UI/browser changes, real account mutations or deployment.

Apply legacy mapping before adding memberships/assignments to its target org; the
mapping service intentionally requires an organisation with only its primary
membership. Runtime login/app handlers still use legacy access. Licence services do
not yet enforce licence expiry against those legacy routes. Feature/resource terms,
new identities, delegated admin permissions, client record linkage, other-app role
adapters, SQL Server/D1 and all administration screens remain pending.

## Administration screens and adapters (2026-10-17, local preview only)

`apps/admin` owns the shared browser controller, token-based CSS and authenticated
Node adapter. `apps/super-admin` owns the Super Admin entry page. The default routes
remain unavailable. Preview requires ORG_ADMIN_PREVIEW=1, NODE_ENV=test/development,
an explicit prepared DATA_DIR resolving beneath the OS temporary directory, SQLite
and loopback binding/requests. No automatic migration/bootstrap. A symlink into a
real workspace cannot bypass the resolved-path check. The preview pages/assets are
in an app-owned allowlist, separate from cloud/public exports; no catalogue grants.

HTTP actors come only from authenticated sessions; body actorUserId/organisationId
overrides are rejected and route scope is checked before account email lookup.
Repository/services re-read persisted authority. Existing origin/host/content-type
validation applies; errors distinguish access, validation and stale revision states
without exposing raw database errors. Missing prepared schema returns unavailable.

Screens implement scoped selection and seat overview, member invitation/reissue/
revoke/edit, Chambers assignments, invitation acceptance and, for Super Admin,
single-licence initial org provisioning, licence lifecycle/limits, primary transfer
and initial activation invite rotation. More licences can be added separately.
New accounts, business/client data, delivery and payment services are not added.
Stale errors preserve inputs until explicit refresh; no automatic write replay.
Secrets remain transient, outside URLs/browser storage, and are cleared on demand,
pagehide, organisation switch and successful acceptance. Theme storage is shared.

Verification: Node/API suite and focused Chrome results are recorded in the ledger.
Four Chrome scenarios cover provisioning/licence edits, member acceptance, assignment,
stale-edit preservation, signed-out/forbidden states and 320/390/768/1440px layouts
with light/dark/system themes. Desktop/mobile screenshots are under ignored
`.publish/admin-desktop.png` and `.publish/admin-mobile.png`; visually reviewed.
Playwright fixtures prepare SQLite in a separate Node process because its loader
does not load node:sqlite directly. Local servers are stopped and temporary databases
removed after each workflow. `apps/admin/README.md` describes the preview boundary.

No runtime migration, real-account change or deployment. Existing app routes still
use legacy single-workspace access and do not enforce these organisation licences.

## Chambers API isolation increment (2026-10-17)

App-owned `organisation-store.mjs` scopes every record/file lookup and staff
reference by organisation ownership/assignment. New writes add ownership atomically.
App-owned `organisation-routes.mjs` reuses existing validation/hearing/payment rules,
accepts only explicit `/api/chambers/<org-id>/<operation>` scope and derives roles
from persisted Chambers assignments. Super Admin/global Owner provide no bypass.
User/org/membership/assignment/licence are rechecked on each request and after body
parsing. Clients cannot enter staff APIs. Expired grace is read-only; suspended or
revoked licences deny reads/writes. Settings/backups/restore require app Owner.

The existing business handler now accepts an injected request-body reader and
scoped clearing method; its default legacy behaviour is unchanged. The scoped
adapter buffers input before BEGIN IMMEDIATE, stages responses until commit and
keeps validation/mutation in one transaction. Preview serializes all API dispatch
on its shared SQLite connection. Legacy private API fallthrough is blocked there,
including unscoped state, global team/backup and unadapted private apps. Named own-
account auth routes, organisation administration and scoped Chambers remain usable;
separately owned public anonymous handlers retain existing behaviour.

Immutable migrations 001/002 are unchanged. Ordered migration 003 is owned by
`apps/advocate/database/003-organisation-workspaces.sql`; it adds per-org profile,
audit and SQLite snapshots, included in full SQL recovery. An existing explicit
legacy workspace mapping copies only its firm profile on upgrade; mapping after
upgrade copies that profile in the mapping transaction. Unscoped historical audit
stays preserved globally and is not exposed as another org's activity.

Scoped JSON backups use `chambers-organisation-backup` version 1 and organisationId.
Restore accepts matching scope, validates existing business rules and clears only
selected records/files/ownership. Cross-org/unmapped ID collisions abort and roll
back replacement; other orgs/accounts/audit remain untouched. Daily/pre-restore
snapshots persist in SQLite and full offline SQL exports. Global SQL export remains
unavailable through Chambers; explicit Super Admin recovery UI/API is pending.

Verification: full regression run **293/293 passes**; final focused Chambers run
**7/7 passes** (includes an additional version-two upgrade test added afterward).
Legacy API regression run **14/14 passes**. Administration Chrome suite **4/4 passes**.
The scoped checks cover matching CNRs in two orgs, filtered state/settings/staff/audit,
cross-org IDs/references/files, active-session revocation/grace, legacy-route denial,
concurrent payment limits, atomic hearing rollback, scoped restore/collision rollback,
full SQL recovery and profile migration. Log: `.publish/organisation-chambers-tests.log`.
Whitespace checks pass. All tests use disposable fixtures; no live data changes,
runtime migration/restart or deployment.

At the end of the API increment, the frontend was not yet adapted (superseded by
the frontend increment below). Default single-workspace runtime behaviour remains
preserved; SQL Server/D1 are not adapted for these organisation tables.

## Chambers frontend organisation context (2026-10-17)

The guarded Node preview injects app-owned organisation-preview.js/CSS before the
existing Chambers controller. Hook assets remain outside public/cloud exports.
Default HTML/controller behaviour stays on its existing paths when preview is off.

Frontend lists usable Chambers assignments, validates requested scope against them
and keeps selected scope in the URL (no business browser storage). Multiple
memberships require a choice; one usable workspace may open automatically. Invalid
requested scope shows selection/access feedback rather than silently opening another
org. Signed-out users can log into existing accounts directly on the Chambers entry,
without depending on blocked legacy portal APIs.

Organisation is visible above the workspace. Business API calls, document downloads,
JSON backup/restore and ledger use explicit organisation paths. Trusted state
capabilities describe scope, read-only mode and administration access. Scoped
settings replaces global team/account creation and SQL export with scoped staff,
authorised organisation-admin links and organisation backup/restore. Password/logout
remain own-account auth.

Grace mode hides writes and disables task completion. Revoked access clears records,
open dossiers and print content. Visibility/BFCache return revalidate; pagehide
clears sensitive state/DOM. State revisions prevent a delayed successful response
repainting after a newer denial. Org switching reloads the document, refuses during
a pending save and confirms discarding an open form. Backend checks remain decisive.

Verification: **294/294 full Node/API checks pass**; **11/11 combined Chrome
workflows pass** (four admin, three legacy Chambers, four scoped). Final scoped
rerun after direct account sign-in **4/4 passes**; strengthened delayed-response
revocation check **1/1 passes**, waiting for response completion/render before
asserting no private content returns. Focused HTTP/API run **10/10 passes**.
Coverage includes client/case, exact document download, fees/payments, reports/CSV,
backup/restore, two-org selection/switch/search/roles, grace/revocation, entry sign-in,
denied scope, 320/390/768/1440px layouts and light/dark/system. Initial failures were
ambiguous selectors and an assertion incorrectly treating the existing public
visitor counter as a business request, corrected before passing runs. Fixture
teardown has a bounded fallback for its owned temporary server processes only.

Screenshots visually reviewed: `.publish/chambers-scoped-desktop.png` and
`.publish/chambers-scoped-mobile.png`. Node log:
`.publish/chambers-scoped-frontend-tests.log`. Syntax/whitespace checks pass. All
work used disposable fixtures; no live database/account changes, migration, runtime
restart or deployment. New identities, broader portal/admin account navigation,
platform recovery controls, client portal and production adapters remain pending.

Before exposing two organisations, verify isolation for direct API access, guessed
IDs, file downloads/replacements, search, reports, audit, imports, exports, backup
and restore. Verify cross-organisation identity, invitation replay, privilege
escalation, capacity races, Master Admin transfer, suspension, expiry, renewal,
concurrent payments and atomic hearing updates. Tests use isolated temporary
DATA_DIR values; browser checks cover mobile, desktop and light/dark/system.

Update this checkpoint and FUNCTIONALITY_LEDGER.md with actual verification results
before stopping. Never mark an unimplemented milestone verified.

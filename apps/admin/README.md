# Organisation administration

Production administration is live on Cloudflare Workers/D1 at `/account`, `/admin`
and `/super-admin`. The explicitly assigned Super Admin provisions organisations,
appoints one primary Master Admin and manages app licences, seat limits and
organisation status. A primary Master Admin manages their own members and app
assignments within those limits. One identity can have independent memberships in
several organisations. Super Admin authority grants no private Chambers access.

The D1 edge adapters use asynchronous governance services, current session authority,
strict API validation and one revision-guarded atomic batch for each business write.
Organisation/platform audit remain separately scoped. The production app catalogue
and licence selector expose Chambers, Tournament Lite, BatchFee Lite and DIGITAL
SAMAJ. All four use live organisation licences, memberships and app assignments;
Samaj additionally retains its community grants and privacy rules.
See [the production cutover](../../docs/ORGANISATION_PRODUCTION_CUTOVER.md) for the
live release, preserved legacy data and recovery/rollback boundaries.

## Local SQLite preview

The separate Node preview requires `ORG_ADMIN_PREVIEW=1`, `NODE_ENV=test` or
`development`, an explicit prepared SQLite `DATA_DIR` beneath the OS temporary
directory, and loopback binding/access. Starting it never migrates a real workspace
or bootstraps accounts. With the preview disabled, Node administration pages/assets
and APIs remain unavailable. This guard is separate from the production Worker
`ORGANISATIONS_ENABLED` flag.

## Features and boundaries

### Administration experience

Super Admin has a searchable organisation directory, selected-organisation
overview, and a four-step creation flow: organisation details, primary Master
Admin, apps/seats, then review/confirmation. Multiple initial app licences use
the existing provisioning API. The review creates nothing until the final action;
wizard drafts remain only in the mounted page. Back/Forward restores steps;
refreshing cannot bypass required earlier fields.

Organisation tasks are grouped into Overview, People, Apps & access, and Settings.
Platform governance (suspension/reactivation, primary transfer, activation
invitation controls, platform audit and supported recovery export) is separate
and remains Super Admin-only. Master Admin has no licence/seat-limit mutation or
platform governance controls. Existing confirmation, password, reason and stale
version checks remain in place.

Licence cards distinguish organisation and app seat usage, configured status,
validity dates and optional read-only grace. Date/time controls explicitly use
India time (IST, UTC+05:30), independent of device timezone, and convert to the
existing ISO UTC API format. Switching licence apps discards unsaved values:
existing licences reload their saved values/version; apps without a licence show
fresh defaults and an explicit **New licence** state. App choices come from the
current backend's supported app list; assignment choices also honour its
`assignmentApps` capability (Chambers-only fallback in the separate Node preview).
Public/personal apps and app-specific business permissions are unchanged.

`frontend/experience.mjs` owns presentation, guided validation and navigation;
`frontend/app.mjs` retains session handling and the existing API commands.
The asset map `backend/preview-assets.cjs` is shared by the guarded Node preview
and the enabled Worker build: `build.cjs --organisations` exports it under
`/_organisations/`, and `fullstack-worker.mjs` serves its mapped public paths with
organisation mode enabled. Thus the former unconditional “Local preview” wording
was inaccurate on deployed `/admin` and `/account`; the template now explains that
actions apply to the selected organisation. The local runtime guard is unchanged.

Both paths support invitation-only primary/member identity activation, invitations,
revocation, membership changes, explicit staff/client app entitlements and seat
reservations. Super Admin also manages provisioning, licence validity/read-only
grace, organisation suspension/reactivation and primary administrator transfer.

Actors come from authenticated sessions and organisation IDs come from route paths.
Body scope overrides fail. Invitations are returned once and remain only in page
memory, with clearing on navigation, visibility changes and explicit dismissal;
secrets never enter URLs or browser storage. Themes retain shared preferences.
The account page provides own-password changes and session-expiry recovery.

The minimal client portal requires explicit current record links and a Client app
assignment. Membership alone grants no client records. Hearings, documents and
finances remain unreleased to clients. Delivery/payment providers are not connected.
D1 browser backup/restore/snapshot UI is unavailable; offline D1 recovery includes
organisation authority, licence, ownership and audit data while excluding sessions.
Native preview offers its separately verified recovery controls.

## Verification

`npm.cmd run test:organisation-readiness` runs the organisation suites with isolated
fixtures. `npm.cmd test` runs the full API suite. `tests/organisation-d1.test.js`
exercises real local D1/Workers plus Chrome sign-in, provisioning and scoped
Chambers navigation. Node preview browser checks are in `apps/admin/tests` and
`apps/advocate/tests/platform.spec.js`. Never seed, reset or use production data to
run tests. Current results and exact continuation points are recorded in the
[functionality ledger](../../docs/FUNCTIONALITY_LEDGER.md) and
[programme plan](../../docs/ORGANISATION_LICENSING_PLAN.md).

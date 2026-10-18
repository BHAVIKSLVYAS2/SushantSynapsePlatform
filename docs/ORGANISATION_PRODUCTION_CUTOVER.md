# Organisation licensing production cutover

Live on 2026-10-17 at `https://apps.sushantsynapse.com`.
Current production Worker: `1ee88a67-edb8-4dcc-973e-016e4e6b28d3` (2026-10-18),
from news-only Newsroom removal `78e8288`. All 11 isolated News browser workflows
pass; read-only live mobile checks show ten stories without chai-break satire,
comic controls, comic requests or page errors. Historical payloads are retained.
Prior production Worker: `2306a539-b078-4811-ad96-cc9ff8cc1226`,
from Newsroom topic correction `a1497d0`, including redesign `dab4bbc` and typography
`433d0af`. Prior Newsroom Worker: `6f302969-d1fd-4701-9def-9ca374c119a5`.
The compact source-credited feed and edition search are live. Wheel release `da9fc3d`
is included; its Worker was `d861d9fc-5303-4d99-b537-7a8d200e067f`.
Playful Arena source `1efe455` is included; its prior Worker was
`d339655d-0737-48b4-83ba-7ac4b88fb631`.
Homepage footer source `b107547` is included; prior Worker
`6715853d-f1d4-4754-b377-7947f169368a` consolidated that footer and visitor count.
Arena/theme source `62c9c6f` is included. Organisation/D1/auth bindings are preserved.
Prior Arena startup Worker: `5608233f-22d5-43b5-834a-aadbc49d0f35`;
committed-source republish: `f8c5684e-9d22-4710-8e67-bbea9b13e170`.
Prior Arena mobile/sound Worker: `2d0e4bf5-bb05-4d2c-a71d-26c0b4ee5bbf`.
Prior performance Worker: `3e2f2830-a42d-4a0e-adc9-cc7672c5eda3`,
from performance release `536b143` plus loading-meter correction `e883c29`.
This frontend release preserves the organisation/D1 cutover and bindings; see
`PERFORMANCE_REVIEW_2026-10-18.md` for live verification and remaining targets.
The verified organisation-source republish was Worker
`71146d50-e086-48d3-b29d-87c72bf193f6`, implementation `dcb843b`.
The original cutover Worker was
`24ee36a4-2ce2-4f9c-be2c-6c25c95ada0a`; subsequent source reconciliation preserved
its data and runtime behaviour. Fresh 339/339 checks and live verification passed.

## Current state

- `/account`, `/admin`, `/super-admin`, organisation/platform audit and the minimal
  client portal now run on Cloudflare Workers/D1. `/signin` opens My account.
- `superadmin@sushantsynapse.com` is the explicitly selected Super Admin. Its
  credential is salted/hashed; the supplied temporary password is not recorded here.
  Change it through My account. Its global compatibility role is Clerk and it has
  no Chambers assignment or organisation membership.
- The existing single active Chambers Owner remains the primary Master Admin of
  the retained workspace. All four existing memberships/app roles were preserved.
- All twenty existing records are retained and explicitly owned by that workspace.
  No reset was required. There are five accounts in total after adding Super Admin.
- The retained workspace preserves its existing Chambers access with a perpetual
  Active licence, 25 staff seats and no client portal seats. Newly provisioned
  organisations receive the limits and validity dates selected by Super Admin.
- Other private applications are unavailable in organisation mode until they have
  their own tenant integration. Public applications remain separate and available.
- Browser SQL export, scoped backup/restore and snapshot screens are unavailable
  on D1. Use the verified offline D1 recovery tool; no overwrite/import web route
  was added. Additional client hearings/files/finances remain unreleased.

## Implementation boundary

`packages/database/organisation-repository-d1.mjs` and
`organisation-administration-d1.mjs` implement asynchronous governance services
using the same policy and immutable schema as native SQLite. The existing staged
SQL adapter accepts an explicit table catalog. Organisation writes retain order,
read their staged changes, and flush once through the shared D1 revision guard.
Foreign keys are deferred within that atomic batch. Validation or stale revisions
leave no partial identity, membership, licence or audit changes.

`apps/advocate/backend/organisation-edge.mjs` derives the app role from live org
membership, assignment and licence. Its repository scopes records, staff, profile,
activity and file ownership. The existing business engine still validates money,
references and atomic hearing updates. Super Admin governance does not bypass
those business access checks. Legacy/global private APIs are denied in org mode.

The production configuration enables `ORGANISATIONS_ENABLED=true`; this is separate
from the guarded temporary Node preview flag. Organisation assets are packaged
behind the flag and their internal storage URLs return 404. All admin reads use
no-store responses. Distributed administration limits are separate from login.

## Cutover and recovery evidence

The user explicitly approved the full sensitive production export to the ignored
local path `.publish/organisation-precutover-20261017.sql` after automatic approval
review required specific destination/payload approval. It was verified offline:
54 table digests, no documents present, and no sessions in the recovery output.
The recovery tool now also preserves organisation schema/checksums, authorities,
licences, memberships, ownership, client grants and audit when those tables exist.

The offline planner and `prepare-organisation-cutover.cjs` require an unmigrated
recovery copy, an explicit retained Owner (or explicit selection of the sole Owner),
and credentials through stdin. They refuse account/patch overwrite, retain existing
credentials, and verify the patch on a second restored database. The private SQL
patch contains only a salted hash, not the supplied raw password.

The maintenance Worker paused writes. Production revision 72 matched the snapshot;
additive migration `0005-organisations.sql` and the prepared mapping were applied.
Verification found five users, twenty records/ownership entries, one Super Admin,
one org and four memberships/assignments; no foreign-key errors; revision 73.
Maintenance was then removed. One final publish hit a transient network failure;
the same tested release was retried successfully. No data was deleted.

Private recovery artifacts and logs stay ignored under `.publish/`; none are in
the frontend asset allowlist. This is a locally verified recovery copy, not a claim
of configured encrypted/off-device backup, retention or recovery-time guarantees.

## Verification

- 339/339 clean full Node/API checks, including synthetic D1/Chrome workflows.
- Exact Wrangler bundle D1/Chrome acceptance passed before cutover.
- Offline cutover/recovery/credential-safe patch tests passed.
- Live Super Admin sign-in, governance/audit, own-account navigation, legacy and
  Chambers access denials, internal-asset 404 and cross-origin rejection passed.
- Live public home and health check passed; 320/390/768/1440px light/dark layouts
  passed with no page errors. Live verification created no business records.

Evidence: `.publish/organisation-production-tests-clean.log`,
`.publish/organisation-release-bundle-tests.log`,
`.publish/organisation-cutover-final.log`,
`.publish/organisation-production-cutover-verification.json`,
`.publish/organisation-production-deploy-retry.log`,
`.publish/organisation-live-verification.json`.

Committed-source republish evidence: `.publish/organisation-commit-tests.log`,
`.publish/organisation-source-deploy.log`, `.publish/organisation-source-live-check.log`.

## Further releases

Do not roll back to the global single-workspace API after additional organisations
start creating records: it would expose tenant data. Any post-activation rollback
must retain tenant-aware routing or remain in maintenance. Keep the current D1
binding, migration history and recovery artifacts. Extend recovery verification
for later schema changes; do not infer that SQL Server is tenant-ready from this
D1 deployment. Other private app adapters, client expansion and scoped D1 recovery
screens remain separate increments.

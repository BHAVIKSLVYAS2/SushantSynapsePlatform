# Organisation licensing: local readiness review

**Historical local review, superseded for Workers/D1 on 2026-10-17.** The production
D1 adapter, tested cutover, requested Super Admin and live verification are now
complete; see [production cutover](ORGANISATION_PRODUCTION_CUTOVER.md). SQL Server,
other private app adapters, extra client data and recovery UI remain separate.
The local evidence below records the earlier preview-only milestone.

Reviewed 2026-10-17. This is evidence for the guarded local SQLite preview,
not approval to activate or deploy it. No live database or account was inspected,
migrated or modified for this review.

## Repeatable verification

From the repository root run `npm.cmd run test:organisation-readiness` for all
organisation policy, repository, onboarding, administration, account, Chambers,
client, audit and recovery API suites. Each suite owns disposable temporary data.
Run `npm.cmd test` for the complete API suite. Browser verification remains
`npx playwright test apps/admin/tests apps/advocate/tests/platform.spec.js`.
These commands do not deploy or run a production migration.

The new `tests/organisation-readiness.test.js` performs a restart recovery drill:

1. Prepare two disposable organisations with separate staff and licences.
2. Create a client, matter and binary document through scoped business APIs.
3. Revoke a membership and suspend the second organisation's app licence through
   the administration API, using current organisation/licence revisions.
4. Request a password-verified Super Admin full recovery export.
5. Restore it into a new, empty temporary database and start a second guarded app.
6. Reject source session cookies and require fresh authentication. Verify record
   access, exact document bytes, cross-org denial, persisted restrictions, export
   audit and the continued legacy-route block. Confirm the original fixture still
   works and its revoked membership remains denied.

This extends SQL round-trip coverage to an actual restored runtime. It does not
verify a production backup destination, retention policy, or recovery time target.
No restore-over-existing-data endpoint is introduced.

## Review evidence and boundaries

| Area | Existing verification | Remaining boundary |
| --- | --- | --- |
| Provisioning | Explicit Super Admin bootstrap, one primary Master Admin, invitation activation/reissue/revocation, transactional rollback | Operator identity selection and legacy workspace mapping remain offline and unperformed on live data |
| Membership and seats | Staff/client pools, reservations, stale revisions, transfer, licence bounds and assignment checks | Other private apps have no equivalent tenant adapter; their access must remain unavailable |
| Access changes | Existing sessions lose access after user/member/assignment/org/licence changes; grace is read-only | Current preview serialises API operations on one SQLite connection; production concurrency and provider adapters require separate design |
| Private records | Scoped records, files, search/report source state, balance enforcement, atomic hearings and scoped restore | Default runtime remains single-workspace; no production tenant cutover is established |
| Clients | Explicit client links and app entitlement, minimal read-only portal, no staff API access | Hearings, documents and finances remain unreleased; delivery/providers are not connected |
| Audit | Separate organisation/platform queries, active authority checks, bounded pages, safe detail projection | Governance reasons are free text with pattern masking, not comprehensive secret classification |
| Recovery | SQL schema/data/hash/blob round-trip, audit rollback on failure, no sessions, and restored-runtime drill | No live backup has been restored; secure storage, retention and operator recovery procedure remain operational prerequisites |
| Administration UI | Local preview browser workflows, responsive themes, expiry/visibility clearing | Pages/API are intentionally disabled by default and absent from cloud serving |

## Activation blockers

- The user now permits necessary data deletion and deployment conditional on
  confidence in readiness. Readiness has not been established: the production
  configuration uses Workers/D1, while administration depends on Node/native
  SQLite. Keep the existing preview guarded until production integration is tested.
- Default private APIs still implement a single workspace. The preview's legacy
  API deny boundary cannot be removed without a complete production routing and
  tenant review, including records, blobs, exports, reports and restoration.
- SQL Server/D1 organisation adapters, production transaction/concurrency behaviour
  and hosting integration are not implemented by this programme.
- Primary operator/Super Admin selection, a verified recovery copy, exact legacy
  ownership mapping and a reversible cutover procedure remain outstanding.
- Closed/Draft lifecycle transitions and additional client releases lack approved
  retention/access rules and remain unavailable.

## Next local increment

Latest priority supersedes the snapshot increment below: implement the production
Workers/D1 persistence/authentication/tenant routing path and verify it in isolated
local D1 before any production cutover. The requested initial Super Admin is
`superadmin@sushantsynapse.com`; it has not been created. No account password is
recorded here. Optional data deletion does not solve the missing runtime adapter.

Provide an organisation-scoped, read-only list/download of existing SQLite
recovery snapshots for a currently authorised Chambers Owner. Snapshots already
exist but lack a scoped recovery screen. Require the same live membership,
assignment and licence checks as other scoped downloads; prevent access to other
organisations and to global recovery data. Do not introduce a new overwrite/import
endpoint or automatically restore a snapshot. Keep runtime activation disabled.

See [the continuation plan](ORGANISATION_LICENSING_PLAN.md) and
[functionality ledger](FUNCTIONALITY_LEDGER.md) for exact verification results.

# Retired-app table deletion awaiting approval

Date: 9 November 2026 IST. The user explicitly requested being asked before
deletion. **Nothing has been deleted.** This plan supersedes preservation rules
only if the user approves its stated scope.

Scope proposed: Sushant Synapse Times and Fund Lens tables in the existing
production Workers/D1 database and the existing local `data/chambers.sqlite`.

| Table | Production rows | Local rows |
|---|---:|---:|
| news_editions | 16 | 5 |
| news_stories | 160 | 50 |
| news_runs | 19 | 7 |
| news_fetch_budget | 18 | 7 |
| news_migrations | 2 | 2 |
| fund_lens_portfolios | 0 | 0 |
| fund_lens_transactions | 0 | 0 |
| fund_lens_migrations | 1 | 1 |
| **Total inside eight tables** | **216** | **72** |

Two obsolete `app_access` entries for `fund-overlap` also exist in each database;
proposed cleanup deletes those exact retired-app rows without dropping the shared
table. Production has no matching retired-app licences or assignments.

Fresh production schema and existing local foreign-key metadata show only the
internal `news_stories.editionDate → news_editions` dependency. No active-app
table has a declared foreign key referencing a retired table. Drop child tables
first. Indexed objects owned by dropped tables disappear with those tables.

Proposed SQL, to be integrated with forward migration/runtime checks after approval:

```sql
DROP TABLE IF EXISTS news_stories;
DROP TABLE IF EXISTS news_editions;
DROP TABLE IF EXISTS news_runs;
DROP TABLE IF EXISTS news_fetch_budget;
DROP TABLE IF EXISTS news_migrations;
DROP TABLE IF EXISTS fund_lens_transactions;
DROP TABLE IF EXISTS fund_lens_portfolios;
DROP TABLE IF EXISTS fund_lens_migrations;
DELETE FROM app_access WHERE appId IN ('news', 'fund-overlap', 'fund-lens');
```

After approval, update/verify forward migration and schema/recovery tooling so
active apps work when these tables are absent and normal startup does not recreate
them. Keep immutable historical migration sources. Verify remaining table/schema
and active-app boundaries before and after the controlled change. Recheck counts
before execution; report any materially changed scope before deleting it.

Shared users, sessions, organisations, licences, assignments, active-app records,
Chambers files and Satire Arena's News Anchors remain outside this deletion.
Existing backups, Cloudflare recovery history and Git history are not purged;
approval of live-table removal does not imply secure erasure of older copies.
No SQL Server service was connected or changed. No new full recovery export is
requested or performed by this preflight.

Evidence under ignored `.publish/`: `retired-table-purge-production-preflight.json`,
`retired-table-purge-local-preflight.json`, `retired-local-access-preflight.json`
and `retired-table-purge-approval-summary.json`. Queries read schema/counts only,
not saved story content or user/financial rows. D1 rejected an initial compound
SELECT and a subsequent dynamic PRAGMA query; supported SELECT/schema queries
succeeded. All preflight activity is read-only.

## Expanded route/code cleanup requested subsequently

The user expanded the scope to old routes and their code. Database deletion is
still awaiting explicit approval. The user authorised finishing and committing source cleanup on 14 November.
No deployment or database deletion is included in that instruction.

* News and Fund Lens business handlers, frontend assets, providers and app
  catalogue entries were already removed by their retirement releases. Their
  remaining explicit 404 checks in Node and Workers are denial guards, not app
  handlers; retain the minimal guards so old URLs cannot reach authentication or
  private fallback paths. Do not restore forwarding, aliases or provider calls.
* Removed the obsolete `/satire-arena/daily` and trailing-slash redirect from the
  public route predicate, direct page handler and cloud dispatcher, plus its
  advertising eligibility. Those URLs now use normal 404 fallback. Updated
  regression tests to use the current sample category route and expect 404 for
  the removed daily entry.
* Make 24 remains active inside `/take-a-break?game=24`; its reusable assets
  are served under `/take-a-break/spark/`. Picksy uses `/picksy`. Old
  `/daily-spark` and `/decision-wheel` entry/API/asset URLs now return 404.
  Their app directories and stored identifiers remain for implementation ownership
  and existing preference compatibility. No game records are reset.
* Old `/certificates` and `/celebration-studio` pages/assets are already absent.
  Their stored app-ID normalisation still preserves existing favourites/history;
  it is not an active old page route. The remaining old-named workspace folders
  contain current Moment Studio regression tests and documentation, not runnable
  old frontends. Keep their active coverage unless explicitly reorganised.
* `/advocate/` and `/signin` canonicalisation, Cloudflare Access's alternative
  login path and default Node business APIs support active runtime contracts.
  They are not part of retired-app deletion.
* After data-deletion approval, remove unnecessary retired-runtime schema seeds,
  catalogue/transfer references and purge-only recovery code, while preserving
  immutable applied migrations and any tooling still needed for old backups.
  Test absent-table behaviour so removed tables are not recreated accidentally.

Database approval is still sought for the eight-table/count scope above and
the exact retired access-reference rows. Source route/code cleanup is separately
authorised and does not grant database deletion permission.
It does not authorise deletion of current apps, shared accounts or old backups.

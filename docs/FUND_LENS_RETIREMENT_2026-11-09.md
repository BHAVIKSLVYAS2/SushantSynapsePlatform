# Fund Lens removal and confirmed CSS cleanup

User authorised removal of confident dead-code/CSS findings and the entire Fund
Lens implementation, then authorised commit and deployment. Source `24f6117` is
deployed to production, Worker `f7e48c5a-bf6c-435b-b97c-d932fa9e8d70`.
Live verification passed seven retired URL checks and thirty layout states;
health 200 and legacy private API denial 409 remain intact. Organisation/D1/auth
settings and existing records are preserved. See the functionality ledger for
release evidence; the remaining sections document implementation verification.

## Removed

- All Fund Lens frontend/backend/calculator/search/provider/ingestion code, public
  holdings/reference datasets, fixtures and dedicated app/package tests: 684 old
  tracked paths removed, including two migration files relocated as described below.
- Node and Cloudflare app/API composition, static asset mappings, catalogue/search/
  SEO/ad entries, shared outage links, UI language blocks, dedicated verification
  tooling, monthly refresh workflow and its CI Python setup, npm commands and
  workspace lockfile entries. Removed old Fund Lens product/research documents and
  its dedicated Home SVG symbol; mixed historical audit/release records remain.
- 157 manually confirmed obsolete CSS selector branches in Home/shared styles,
  Studio, News, Ritual, Admin and Daily Spark (15,578 source bytes at that step),
  plus remaining dead Studio-gated rules discovered during verification.
- Unused Ritual `mountLanding` import and obsolete helper. Dynamic class families,
  tested non-Fund exports, mixed live selectors and unrelated code are retained.

Retired `/fund-overlap` page/assets and `/api/fund-overlap` requests now return 404
before authentication/provider calls. The frontend proxy does not forward these
requests. Public holdings archives are no longer built or exported. Shared CSS,
catalogue and language bundles were rebuilt through their owning pipelines.

## Data preservation

No existing database, account, record, private portfolio transaction, document,
preference, grant, backup or runtime cache was opened for modification or deleted.
Immutable SQLite and SQL Server portfolio schema files moved byte-for-byte to
`packages/database/retired/fund-lens`; the database catalogue/transfer ownership and
historical D1 migrations remain intact. There is no DROP migration.

Fresh Node workspaces no longer create portfolio tables through an app handler.
Full SQLite exports include existing retired tables/rows/indexes through the small
database-owned `retired-recovery.cjs` helper. SQL Server/D1 schema/recovery metadata
remains to support old records. This compatibility metadata is intentionally not
an active app or financial API. Existing per-user watchlist preferences remain
opaque saved data; no new UI or write capability is retained.

## Verification

The initial complete isolated Node run reported 571/575 passing; failures exposed
stale generated catalogue output, an obsolete edge asset count, a missing relocated
SQL Server migration and a catalogue count including the retired app. All four
were corrected. A focused 39-case rerun passed, including affected API/edge,
catalogue, SQL migration and Take a Break checks, plus new recovery tests.

Playwright CLI passed 48 width/theme/layout states across both Home modes, Ritual
reader, Studio certificates/cards, News and Daily Spark. Four retired URL checks,
Home search and Ritual chapter/large-text interactions pass without page errors.
Local admin remains unavailable by default. Home/reader screenshots reviewed.
Ad requests were blocked; browser tests used a fresh temporary DATA_DIR.

The frontend/fullstack dry build passed. A subsequent production-profile check
conflicted with a concurrent test export directory; its retry uses an isolated
copy of the working tree. Final full suite: 577/578, with only the shared-directory
conflict failing; its sequential edge rerun passes 7/7. Final source/recovery tests
pass 6/6. The final isolated organisation-enabled production dry build passes and
contains no Fund Lens/reference archive/runtime assets. Final authored CSS removal
is 18,719 bytes across twelve files, excluding the removed app's own stylesheets
and generated bundles. Immutable migration copies are byte-identical to HEAD.

Evidence: `.publish/fund-removal-files.json`,
`.publish/confirmed-css-removal.json`, `.publish/removal-focused-node-final.log`,
`.publish/removal-node-final.log`, `.publish/removal-cloudflare-build.log`,
`.publish/removal-production-build-isolated.log`, `.publish/cleanup-browser-review.log`,
`output/playwright/cleanup-home-mobile.png`,
`output/playwright/cleanup-ritual-reader.png`.

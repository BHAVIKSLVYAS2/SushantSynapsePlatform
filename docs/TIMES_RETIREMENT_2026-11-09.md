# Sushant Synapse Times retirement

Deployed source `53a3216`, Worker `30d54225-691a-4d27-87ac-d9f673af6cc8`,
9 November 2026 IST. Eight retired URLs and thirty live layout states pass, with
health 200 and legacy private state denial 409. Organisation/D1/auth settings and
existing archive records are preserved. Live evidence is in the functionality
ledger. No-JavaScript catalogue checks pass with twelve cards and no Times link.

User authorised complete app/code removal, commit and production deployment.

Removed `apps/news` frontend/backend, source providers, publication/fetch/cache
services, artwork, app fixtures and dedicated tests, Cloudflare source handler
and verification script, static assets, catalogue identity/discovery/SEO/ad entries,
shared outage links, newspaper language/reading controls and obsolete shared CSS.
Removed npm workspace/script/lock entries and NEWS_LIMITER configuration in all
profiles. Removed the old standalone News plan; historical mixed release/audit
documents remain historical. No other app is retired by this change. Satire
Arena's independent News Anchors lineup, routes and voting remain active.

Both Node and Workers reject `/news`, its old assets and `/api/news` with 404
before provider/database/authentication dispatch. No news source requests or
publication service remains. Current privacy/terms descriptions no longer claim
the retired publishing feature. Shared bundles and the no-JavaScript catalogue
are rebuilt from their owning source pipelines.

No existing database, archive record, account, grant, preference, document, backup
or runtime cache was deleted or changed. Four immutable SQLite/SQL Server schema
sources moved byte-for-byte into `packages/database/retired/news`. Catalogue and
historical D1/SQL migrations remain to preserve recovery compatibility. The
database-owned retired recovery helper now includes existing news tables/rows;
fresh Node workspaces do not create them. New tests restore an edition, story
and fetch-budget row without any app implementation.

Verification: 34/34 focused Node/API/schema/recovery/delivery checks passed. Full
isolated suite: 559/560; one generic HEAD test still used the deleted News URL.
It now tests an active tool; the edge/catalogue/recovery rerun passes 14/14.
Local Playwright CLI passed 48 theme/width/layout states across both Home modes,
Ritual reader, Moment Studio cards/certificates, Daily Spark and News Anchors.
Six retired URLs and Home search pass; no page errors. Ad requests blocked;
browser fixtures use temporary DATA_DIR. Final rerun, deployment and live results
are recorded in the functionality ledger.

Evidence: `.publish/times-removed-files.json`, `.publish/times-focused-node.log`,
`.publish/times-node-full.log`, `.publish/times-final-rerun.log`,
`.publish/times-browser-review.log`, `.publish/times-build-ui-final.log`.

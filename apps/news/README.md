# Sushant Synapse Times

Author: **Bhavik**. The newspaper at `/news` has shared theme preferences, owner-only preview, responsive layout, print styling and honest empty states.

Deployed 2026-09-16 at https://apps.sushantsynapse.com/news. Public assets match the tested files, anonymous API access is denied, and database contents were unchanged by the restart. Verification: 47 Node tests and 13 Chrome workflows passed before deployment.

The platform catalogue remains **Planned**, with no launch action. `/api/news/status` requires sign-in and app access, and is limited to owners during this preview. The public HTML/CSS/JS shell contains no news or private data.

Stage 2 adds app-owned SQLite editions, ordered stories and generation-run storage through `database/001-editions.sql`. Saved editions are immutable by IST date and included in full SQL exports. Publication validation requires ten distinct stories, valid source URLs, the edition's 24-hour news window and satire linked to one of its stories. Saving is atomic. Generation-run orchestration is reserved for the provider step.

Protected read APIs: `GET /api/news/editions` (30 dates per page, optional `before=YYYY-MM-DD`) and `GET /api/news/editions/YYYY-MM-DD`. The reader supports date selection, latest/previous/next among loaded archive dates, loading older dates, bookmarked date URLs, source links and Print / Save PDF. Missing dates do not fetch or create content. Reading saved editions makes no external calls.

Stage 2 deployed on 2026-09-16 after backup `data/backups/pre-news-archives-20260916-232213.sqlite`. News migration 1 applied; edition, story and run tables are empty. SQLite integrity is `ok`; every pre-existing table's content hash matches the backup. Public News HTML/JS/CSS match workspace files and anonymous archive/status requests return 401. Verification before deployment: 49 Node tests and 14 Chrome workflows passed. No demo editions were created. The catalogue remains Planned and the owner preview restriction remains until the manual app is usable.

News fetching, generated briefs/satire and scheduling are not connected. Fetch remains disabled. Test editions are confined to isolated temporary databases; the production app has no fixture or arbitrary publication endpoint.

Run `npm.cmd run test:news` for the isolated Chrome workflow. Run `npm.cmd test` and `npm.cmd run test:e2e` for platform regressions.

Next: stage 3 in [the News plan](../../docs/NEWS_APP_PLAN.md), connecting and validating the free news provider before text generation.

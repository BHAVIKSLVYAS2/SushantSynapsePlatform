# Sushant Synapse Times

Author: **Bhavik**. The newspaper at `/news` has shared theme preferences, owner-only preview, responsive layout, print styling and honest empty states.

Deployed 2026-09-16 at https://apps.sushantsynapse.com/news. Public assets match the tested files, anonymous API access is denied, and database contents were unchanged by the restart. Verification: 47 Node tests and 13 Chrome workflows passed before deployment.

The platform catalogue remains **Planned**, with no launch action. `/api/news/status` requires sign-in and app access, and is limited to owners during this preview. The public HTML/CSS/JS shell contains no news or private data.

Stage 2 adds app-owned SQLite editions, ordered stories and generation-run storage through `database/001-editions.sql`. Saved editions are immutable by IST date and included in full SQL exports. Publication validation requires ten distinct stories, valid source URLs, the edition's 24-hour news window and satire linked to one of its stories. Saving is atomic. Generation-run orchestration is reserved for the provider step.

Protected read APIs: `GET /api/news/editions` (30 dates per page, optional `before=YYYY-MM-DD`) and `GET /api/news/editions/YYYY-MM-DD`. The reader supports date selection, latest/previous/next among loaded archive dates, loading older dates, bookmarked date URLs, source links and Print / Save PDF. Missing dates do not fetch or create content. Reading saved editions makes no external calls.

Stage 2 deployed on 2026-09-16 after backup `data/backups/pre-news-archives-20260916-232213.sqlite`. News migration 1 applied; edition, story and run tables are empty. SQLite integrity is `ok`; every pre-existing table's content hash matches the backup. Public News HTML/JS/CSS match workspace files and anonymous archive/status requests return 401. Verification before deployment: 49 Node tests and 14 Chrome workflows passed. No demo editions were created. The catalogue remains Planned and the owner preview restriction remains until the manual app is usable.

Stage 3 adds **Fetch today's news preview**, an owner-only manual fetch from the free, keyless GDELT DOC API. Ten distinct English headline/source records are saved as an unpublished preview. Repeated fetches and page reloads use SQLite without contacting GDELT. Complete published editions take precedence. The app does not yet generate briefs/satire or publish fetched previews.

Stage 3 is deployed. Verification resumed 2026-09-18: public asset hashes match; migration 2 is applied and all News data tables remain empty; only the expected migration metadata changed compared with `data/backups/pre-news-fetch-20260916-233954.sqlite`. Existing business data is preserved. Full workspace verification before deployment: 52 Node tests and 15 Chrome workflows passed. Live provider availability remains a separate unresolved check below.

`POST /api/news/fetch` accepts an empty JSON object for today or `{ "date": "YYYY-MM-DD" }` to reopen existing data/retry an existing run. Historical dates cannot start new runs. `GET /api/news/preview/YYYY-MM-DD` reads only stored data. Access remains restricted to owners while the app is Planned. No API key is needed; external request URLs are fixed by code.

GDELT is queried once for up to 100 relevance-ranked English records mentioning India or from Indian outlets; ten are chosen after validation and duplicate removal, with at most three per hostname. Preview timestamps are **GDELT observation times**, not original publication dates. No article bodies, descriptions or images are fetched. Source attribution links accompany each headline and the preview credits GDELT. API/docs: https://blog.gdeltproject.org/gdelt-doc-2-0-api-debuts/ and data terms: https://gdeltproject.org/about.html.

Migration 2 adds `news_fetch_budget` to SQLite/full SQL exports. Persisted run leases expire after two minutes; retries retain their original cutoff. Limits: one-minute global cooldown, five attempts per edition and twenty requests per UTC day. Failed fetches save safe errors, leave archives unchanged and require manual retry. Startup never calls providers automatically.

Live provider checks have returned 429, network failure and an invalid article list; live ten-story availability remains unverified. The implemented error/retry path is explicit. Test editions and provider mocks are confined to isolated temporary databases; there is no production fixture or arbitrary publication endpoint.

Run `npm.cmd run test:news` for the isolated Chrome workflow. Run `npm.cmd test` and `npm.cmd run test:e2e` for platform regressions.

Next: stage 4 in [the News plan](../../docs/NEWS_APP_PLAN.md), generating briefs and satire after live news verification. Adapt publication storage to preserve observation-time provenance before accepting GDELT data as a published newspaper.

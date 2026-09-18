# Sushant Synapse Times

By **Bhavik**, at `/news`. Manual newspaper publication is implemented: the owner clicks **Fetch today's newspaper**, the server selects ten recent English PIB public releases, adds credited source excerpts and one clearly labelled fictional satire, and saves the complete edition atomically in SQLite. Repeated clicks and reloads open the saved edition with no external calls. Shared theme, mobile layouts, source links, date archives and Print / Save PDF are supported.

News is Available in the platform catalogue. Owners can publish; users explicitly granted News access can read. Anonymous users and users without access cannot read editions. Publication accepts only an optional edition date, never user-supplied article content. Existing editions are immutable. No accounts or app grants are changed by this release.

## Source and editorial scope

This initial key-free release covers **India public affairs**, using [PIB's English release listing](https://www.pib.gov.in/Allrel.aspx?lang=1&reg=3). It is a government-source digest, not comprehensive independent or world news. The twenty most recent release IDs are candidates; ten valid distinct headlines are selected and ordered by actual publication time. The source window is the preceding 24 hours ending at the first fetch. Briefs preserve a source paragraph and prominently credit PIB. No images or third-party media are copied. [PIB's copyright policy](https://www.pib.gov.in/content/3604_2_CopyrightPolicy.aspx?lang=1&reg=3) permits accurate, credited reuse of its material; third-party material is excluded.

Satire is original fictional commentary produced by a **local editorial template**, linked to a selected headline. It is explicitly separated from source reporting and never labelled AI-generated. No AI key, paid service or model runtime is required. A broader news provider and richer generation can be added later. GDELT's tested discovery adapter remains in source but is not used for publication because live delivery was unreliable and observation timestamps are not publication timestamps.

## Persistence and limits

App-owned migrations `001-editions.sql` and `002-fetch-budget.sql` register editions, ordered stories, run snapshots and budgets for full SQL exports. `repository.js` validates exactly ten stories, source URLs, publication times, satire association and atomic immutable storage. `fetch-service.js` saves the original cutoff and source snapshots, uses a two-minute lease, five attempts per date, a one-minute global cooldown and twenty provider attempts per UTC day. Each PIB attempt makes at most 21 fixed-host requests, at most four concurrently, with a shared 90-second deadline and a 2 MB limit per response. Fewer than ten valid stories leaves an unpublished run and a retry message. Publication failure retains the source snapshot for retry without another fetch.

`POST /api/news/fetch` accepts `{}` for today or `{ "date": "YYYY-MM-DD" }` to reopen an edition or resume an existing run. Historical dates cannot start new runs. `GET /api/news/preview/YYYY-MM-DD` is owner-only operational status. Read APIs are `GET /api/news/editions?before=YYYY-MM-DD` (30 dates per page) and `GET /api/news/editions/YYYY-MM-DD`. Missing archive dates never fetch.

**05:00 IST automation is deferred**, as agreed for the manual first release. The app never fetches at startup. The Windows host must be running for access and online to fetch new releases. An early-day fetch may fail if the listing has fewer than ten recent releases.

## Verification

Run `npm.cmd test` and `npm.cmd run test:e2e`. Tests use isolated temporary databases and source fixtures. Live ten-story PIB selection was verified on 2026-09-18; deployment and final regression evidence are recorded in `docs/FUNCTIONALITY_LEDGER.md`.

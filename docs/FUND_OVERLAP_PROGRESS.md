# Fund Lens national expansion

Checkpoint: 2026-09-15. Objective: equity-overlap comparison across Indian fund houses rather than PPFAS alone.

## Implemented

- 2026-09-16: four-feature analytics release completed and deployed. Exact-plan returns/chart, combined allocation exposure, historical SIP and private saved watchlists. Step-by-step completion, tests, limits and deployment evidence: [feature progress](FUND_LENS_FEATURE_PROGRESS.md).

- Final UI verification: all 5 Fund Lens browser workflows passed together (31.7 seconds). Live HTTPS app.js and style.css returned 200 and matched local SHA-256 hashes. Refresh Fund Lens to load the update; no server restart required.

- UI refinement (2026-09-15): sticky selection/Compare controls with horizontally scrollable selected chips; smaller hero and compact cards; per-fund loading/error, saved-cache and partial-coverage status; accurate publisher labels after loading. All fund requests settle before retry is enabled. Sticky results section navigation and Edit funds return focus to search. Holdings/industry tables have bounded scrolling, with full tables retained for print. Source hashes are expandable while dates and coverage remain visible. Desktop light/mobile dark screenshots reviewed; responsive checks cover 320, 390, 768 and 1440 pixels. Five Fund Lens browser workflows passed, plus the extended navigation/source-details/sticky-button workflow. No business data changed.

- Selection UX correction (2026-09-15): selected funds remain visible above the changing search results. The example comparison button is hidden and guarded once any fund is selected, so it cannot replace HDFC with the PPFAS example set. The clear action explicitly says "Clear selected funds". The exact HDFC → Parag Parikh → clear-search → HDFC → failed-search/retry flow is covered by a passing mobile browser regression; only explicitly added funds become selected. All 5 Fund Lens browser tests and 34 Node tests pass. Static-only update; no database writes or server restart required.

- National discovery uses the free, no-key MFapi catalogue. Live response contained 37,882 scheme records (including historical schemes and plan variants). Exact underlying families are grouped, Direct Growth is preferred, and scheme-code lookup remains exact.
- Search supports multiple words, joined words such as Flexicap, pagination, exact-name ranking and explicit former-name annotations. Large Cap no longer ranks below Large & Mid Cap for an exact query.
- Tickertape's no-key website API supplies holdings, stock ISINs and industries. Current equity weights must reconcile with its latest dated asset-allocation record; the date basis is disclosed.
- Groww's existing no-key website API is an independent fallback after exact family matching. Rows from different sources/dates are never combined into one fund.
- Shared authentication and grants protect search, snapshots and cached responses. AMFI scheme IDs work in comparison links; old PPFAS and Groww links still work.
- Last-good public reference data persists under DATA_DIR/fund-overlap-cache. Content hashes verify immutable versions; a small pointer is published last. Failed refreshes and date regressions retain the previous portfolio with its original reporting date and an explicit stale warning.
- Catalogue/metadata/portfolio TTL is 24 hours; stock identifier TTL is 7 days. Failed attempts cool down for 60 seconds. Public API requests have timeouts, response size limits, four concurrent slots, spaced starts, URL allowlists and no forwarded credentials.
- `npm.cmd run refresh:funds:national` refreshes saved national schemes; failure produces a nonzero exit code while preserving last-good data. Refresh occurs on demand after TTL; no external scheduler was configured.

## Research and limits

| Source | Verified result / use |
|---|---|
| [MFapi](https://www.mfapi.in/) | Live full catalogue and scheme metadata return 200 without a key. Implemented for discovery/identity; NAV itself cannot calculate stock overlap. |
| [Tickertape public API](https://api.tickertape.in/mutualfunds/list) | Live holdings and stock-info JSON work without credentials. Implemented. Its list endpoint is capped at 1,000 entries and is used only as a resolver, never as the national catalogue. |
| [Groww](https://groww.in/mutual-funds) | Live cross-AMC holdings work without credentials. Implemented as exact-family fallback and for legacy links. |
| [MFdata](https://mfdata.in/docs) | Advertises free holdings; repeated live checks timed out, later returned HTTP 522. Not integrated. |
| [MarketDataAPI](https://github.com/gupta-saransh/MarketDataAPI) | Free documented API returned empty holdings for HDFC Direct and Regular. Its source depends on FinAPI; not sufficient for overlap. |
| [FinAPI](https://www.finapi.upvaly.com/) | Published pricing reserves full holdings for Pro; not selected. |
| [WealthTicker](https://wealthticker.in/developers) | Overlap is a paid Pro endpoint; not selected. |

Tickertape/Groww are undocumented website APIs, not contracted or guaranteed public services. No claim of guaranteed holdings for every scheme or redistribution rights. Search includes historical schemes; unavailable/unsupported portfolios produce an explicit error, never zero overlap. Debt, cash, derivatives, REIT/InvIT and fund units are excluded. No hedge netting or fund-of-funds look-through. Unknown equity identifiers are listed with omitted NAV weights. Cache retention is manual; versions are not automatically deleted. Legacy Groww-only links retain their original in-memory cache behavior; national AMFI links use disk recovery.

## Live sample evidence (2026-09-15)

All rows below report 2026-08-31 portfolios; weights are percentages of NAV. This is sample verification, not a full audit against every official disclosure.

| AMFI code | Scheme | Source | Included equities | Included NAV | Unresolved NAV |
|---|---|---|---:|---:|---:|
| 118955 | HDFC Flexi Cap Direct Growth | Tickertape | 78 | 94.858550 | 0 |
| 120503 | Axis ELSS Tax Saver Direct Growth | Groww | 68 | 98.208710 | 0 |
| 119598 | SBI Large Cap Direct Growth | Groww | 52 | 97.922325 | 0 |
| 120586 | ICICI Prudential Large Cap Direct Growth (erstwhile Bluechip) | Groww | 84 | 95.272436 | 0 |
| 120716 | UTI Nifty 50 Index Direct Growth | Groww | 50 | 100.004905 | 0 |
| 118825 | Mirae Asset Large Cap Direct Growth | Groww | 72 | 99.312409 | 0.01688014 |
| 118778 | Nippon India Small Cap Direct Growth | Groww | 253 | 96.830000 | 0.34 |
| 120166 | Kotak Flexi Cap Direct Growth | Tickertape | 57 | 98.590879 | 0 |

UTI's slight excess above 100% is within the existing 0.5 percentage-point disclosure tolerance; weights are preserved rather than silently changed.

## Verification and deployment

- `npm.cmd test`: 34 passed. The eight new tests cover the catalogue, paging, exact matching, weights/dates/ISINs, fallback, restart recovery, corrupt cache detection, rate limiting and authorization.
- `npm.cmd run test:e2e`: all 8 Chrome workflows passed (1.2 minutes), including 4 Fund Lens workflows plus Chambers and portal. Isolated temporary databases only.
- The final exact-name/former-name fixes were followed by another passing 8-test national-provider run.
- Initial Groww release deployed successfully through the existing Windows launcher/tunnel; HTTPS health and Fund Lens return 200, anonymous search returns 401.
- Pre-deployment backup: data/backups/pre-national-funds-20260915-124551.sqlite; integrity ok; 18 records, 1 account, 0 files.
- Final national-provider deployment verified on 2026-09-15: HTTPS `/healthz`, `/`, `/advocate`, `/fund-overlap` return 200; anonymous national search and scheme snapshots return 401. Public app.js, engine.js and style.css hashes exactly match the tested local files.
- Final consistent backup: data/backups/pre-national-api-20260915-193921.sqlite. SQLite integrity is ok and all table counts matched after restart (18 records, 1 user, 0 document files; other tables unchanged).
- `npm.cmd run refresh:funds:national`: 12 saved schemes checked, 0 failures, all retained 2026-08-31 reporting dates. Includes additional Large & Mid Cap, Next 50 and Smallcap 250 index samples.
- Production uses the existing launcher on port 3001 and dedicated Cloudflare tunnel. No user records or accounts created for tests. No commit/push performed.

## Resume instructions

1. Read this checkpoint, FUNCTIONALITY_LEDGER.md and the app README. Inspect the uncommitted Git diff before changing code.
2. Preserve data/chambers.sqlite and data/records.json. Public cache is separate from workspace business state.
3. Recheck provider availability if failures occur; use the saved reporting dates and source provenance. The refresh command can refresh already saved schemes without selecting funds again.
4. Future coverage expansion requires additional verified source adapters or a suitable supported data contract. Do not describe debt/gold/fund-of-funds as implemented, or a search result as proof of available holdings.
5. This deployment requires the Windows computer, Node launcher and dedicated Cloudflare tunnel to remain running; automatic startup is still unconfigured.

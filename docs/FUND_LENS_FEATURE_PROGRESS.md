# Fund Lens feature roadmap

Latest addition: requested personal portfolio tracker (option 2) completed and deployed. See [FUND_PORTFOLIO_PROGRESS.md](FUND_PORTFOLIO_PROGRESS.md) for its tests, migration, CSV format and resume checkpoint. Earlier features below remain complete.

Requested 2026-09-15; resumed 2026-09-16 after automatic usage-limit rejection prevented the original edit. Existing overlap/UI release is preserved.

| Order | Feature | Status |
|---|---|---|
| 1 | Exact-plan performance comparison and growth chart | Verified and deployed; calculation/provider and exact-plan browser checks passed. Live HDFC 118955: 3,373 records, latest 2026-09-15. |
| 2 | Allocation-weighted combined equity exposure | Verified: deterministic allocation test and full selection/exposure browser workflow passed (15.3s) |
| 3 | Historical monthly SIP simulation | Verified: month-end/next-NAV, gap rejection and XIRR tests passed; extended performance/SIP Chrome workflow passed (9.1s) |
| 4 | Account-owned saved watchlists with latest NAV | Verified: SQLite restart persistence, account isolation, validation and access tests; browser save/reload/NAV/load/delete passed |

MFapi documentation checked: https://www.mfapi.in/docs/ — free, no API key, daily NAV history; fair-use caching required. Holdings family matching must never silently choose a plan for return calculations. Growth options only for historical returns until distribution-adjusted data exists. Record tests and deployment evidence here after each step.

## Release checkpoint — 2026-09-16

All four features implemented and deployed through the existing production launcher/tunnel. Full Node suite: 39 passing; subsequently added NAV route validation/revocation test and reran all five analytics tests successfully (40 distinct Node tests total). Full Chrome suite: 10 passing (Chambers, Fund Lens and portal). Final mobile-chart change followed by another passing analytics/SIP/watchlist browser workflow. Desktop light and mobile dark screenshots reviewed; 320/390/1440px checks pass.

Live HTTPS: app.js, analytics-engine.js, analytics-ui.js and style.css return 200 and match local SHA-256 hashes. Home, Chambers and health return 200. NAV/watchlists return 401 anonymously; normal-user exact-plan search, NAV history and watchlist read return 200. Verification session logged out. No demonstration watchlists were created in production.

Backup: `data/backups/pre-fund-analytics-2026-09-16T04-14-27-109Z.sqlite`. Existing SQLite preferences hold `fundLensWatchlists`; no schema migration needed. NAV/reference cache remains separate from personal data. Watchlists contain plan identifiers and labels only, never entered investment amounts.

Post-deployment SQLite integrity: `ok`. Records (18), users (3), files (0), settings (3), grants (5), preferences (2) and sessions (1) match backup counts. Audit count increased 14 → 15 from the expected verification sign-in; its session was logged out.

### Where to find features

- Open **Performance comparison** above the holdings selector. Search exact plans; up to four plans may be compared, including Direct versus Regular. Choose 1/3/5 years. Actual shared dates appear above the chart; insufficient history produces an explicit error.
- After loading NAV history, use **Historical SIP simulator**. Purchase schedule and XIRR are inspectable. A NAV gap over seven days is rejected. Taxes, exit loads and transaction charges are excluded. Growth options only.
- **Your saved watchlists** is inside the same panel: save the exact-plan selection, load it, fetch latest available NAV, or delete it. Limit: 10 private lists, four plans each. Latest NAV dates and cache fallback are explicit.
- Run a holdings comparison, then choose **Combined exposure** in results navigation. Inputs are hypothetical/current fund values, held only in tab memory. Disclosed NAV weights are used; excluded assets are not assumed to be cash. Source dates/classifications may differ.

## Resumed extension — 2026-09-16

The four-feature release remains complete. User requested continuation; continuing the remaining ideas from the original feature list:

| Order | Feature | Status |
|---|---|---|
| 5 | Historical volatility, observed drawdown and recovery | Implemented, verified and live |
| 6 | Monthly sampled 1/3/5-year rolling returns | Implemented, verified and live |

Baseline before this extension: all 40 Node tests passed. These calculations use the existing exact-plan NAV history, without new providers or database changes.

### Extension verification and resume checkpoint

- All **43 Node tests** and **7 Fund Lens Chrome workflows** passed. After fixing stale results during refresh, the risk/rolling browser workflow passed again (8.7 seconds), including delayed NAV failure and changing the period while loading. `git diff --check` passes.
- Desktop and mobile dark screenshots reviewed. Layout checks cover 320, 390, 768 and 1440 pixels. Wide tables scroll within their containers.
- Live HTTPS `analytics-engine.js`, `analytics-ui.js` and `style.css` return 200 with SHA-256 hashes matching workspace files. Static-only deployment; no server restart or production database writes.
- Live MFapi sample: scheme 118955, latest NAV 2026-09-15; three-year risk period 2023-09-15 to 2026-09-15, 128 three-year rolling windows ending through 2026-08-31. Live computation succeeded; this is a smoke check, not independent verification against an AMC risk report.
- Open **Performance comparison**, load exact Growth plans, then see **Historical risk comparison** and **Rolling returns**. Risk follows the performance period. Rolling windows use all shared history with a separate 1/3/5-year selector and an inspectable date window.
- Volatility: sample standard deviation of consecutive simple NAV returns × √252, at least 30 changes, at least 180 observations/year and no gap over seven days. Otherwise explicitly unavailable. Drawdown/recovery use each plan's available NAVs inside the common period; gaps can understate falls. Recovery is days from the worst observed peak to regaining that peak within the period.
- Rolling windows: common NAVs on/before completed month-end and anniversary, maximum seven-day endpoint gaps, actual days/365.25 annualisation, leap-day clamping, at least two windows. Same windows for every plan; skipped months reported. Positive-window share is historical frequency, not a forecast probability.

All features from the original suggestion list are now implemented, including Direct-versus-Regular comparison through exact-plan performance. No pending implementation remains in this feature list. Future work needs a specific new request; do not repeat completed releases when resuming.

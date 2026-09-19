# Personal portfolio tracker

Requested: implement option 2 (personal portfolio tracker with manual transactions and CSV import). Started 2026-09-16.

## Scope

- One private portfolio per account; exact AMFI plans, purchases, redemptions and cash distributions.
- Actual statement units and amounts; dates in YYYY-MM-DD; no inferred purchase prices.
- Add/edit/delete validated API, atomic preview/import, duplicate suppression, revision conflicts and unit-balance enforcement.
- Dated NAV valuation, cash-flow gains and XIRR. Missing/common-date data disclosed, never valued at zero.
- SQLite app tables with additive tracked migration; include app tables in full SQL export. No changes to existing records or accounts.

## Progress

Completed and deployed 2026-09-16. All **47 Node tests** and **12 full-platform Chrome workflows** passed. Tests cover CSV quoting/precision, formula-safe export roundtrip, redemption/distribution arithmetic, unavailable/mixed-date NAVs, ambiguous XIRR, SQLite migration/restart, account isolation, revision conflicts, atomic imports and full SQL restore. Browser workflow covers manual BUY, reload, duplicate-aware CSV preview/save, oversell rejection, edit, CSV export and safe deletion. Final mobile table refinement was followed by another passing portfolio workflow (10.4 seconds). Desktop light and mobile dark screenshots reviewed; 320/390/768/1440px layouts have no page overflow.

## Deployment evidence

- Backup: `data/backups/pre-personal-portfolio-2026-09-16T15-51-33-663Z.sqlite`; integrity `ok`.
- Existing production Node process restarted through the existing launcher; health returned `ok`. Migration version 1 applied once. New portfolio and transaction tables are empty; no demonstration portfolios were created.
- Post-migration integrity `ok`; every pre-existing table's full row-content hash matched the backup (records, users, sessions, files, audit, settings, grants and preferences).
- Live HTTPS app.js, portfolio-core.js, portfolio-ui.js and style.css return 200 and match workspace SHA-256 hashes. Anonymous portfolio read returns 401. Normal-user portfolio read, valuation and non-saving preview return 200. Preview validated a public scheme without changing revision or transaction count. Verification session logged out; its normal sign-in audit entry is expected.
- No required work remains for option 2. Future continuations should read this checkpoint and follow a new specific request, rather than recreate this tracker.

## User workflow

Open **My portfolio** near the top of Fund Lens. Expand **Add or edit a transaction** to find an exact plan code and record statement date, units and cash amount. Expand **Import transaction CSV** to download the template, select a file, preview validated rows, and explicitly save. Use **Refresh portfolio** for current available NAVs, **Export transactions CSV** for a personal copy, and transaction-row Edit/Delete for corrections.

## Implementation details

- App-owned additive migration: `apps/fund-overlap/database/001-portfolio.sql`. Tables: `fund_lens_portfolios`, `fund_lens_transactions`, `fund_lens_migrations`. Shared schema registration includes these in full SQL exports; existing shared and Chambers schemas remain unchanged.
- One portfolio per authenticated user; all roles with Fund Lens access can manage only their own transactions. No financial details are written into the shared activity log. Administrative full-database backups include all users' portfolio data; Chambers JSON backups are not portfolio backups.
- Limits: 50 exact AMFI schemes; 10,000 transactions per account; 500 rows / 1 MB per import. Amounts: two decimal places; units: six. Dates from 1990 through current India date. BUY / SELL / cash DIVIDEND supported. Same-day BUY precedes SELL for unit validation.
- Duplicate identity includes scheme, date, type, units, amount and optional statement reference. Existing/batch duplicates are skipped; a distinct genuine same-day transaction can use a different reference. Preview and final save both validate balances and revision. A single invalid row prevents the entire write.
- Current value uses dated NAVs, with a common shared NAV date for complete portfolio totals. No shared date, provider failure, or a transaction newer than NAV prevents a misleading total. Closed positions need no NAV. Actual cash-flow gain includes purchases, redemption proceeds and distributions; no tax/FIFO gains are claimed.
- XIRR uses actual dates/365.25, groups same-day cash flows and scans for roots from −99.99% to 1,000,000% annualised. Multiple detected solutions or no solution in that range show unavailable. Enter cash paid/received and units from statements, including relevant charges in the cash amounts. Corporate actions and transfers are not automatic.
- CSV template headers: `scheme_code,date,type,units,amount,reference`. UTF-8/BOM, quoted commas and escaped quotes supported. Reference is optional. Export protects formula-leading references and roundtrips their original value. Broker-specific documents must be converted to the template; no broker/account connection is made.

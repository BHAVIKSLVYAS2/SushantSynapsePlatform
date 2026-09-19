# Fund Lens

Fund Lens lives at `/fund-overlap` and in the platform catalogue. Owners can launch it immediately. Owners grant other users access through **Team access → Fund Lens**. Roles are read-only inside this app; it creates no financial records.

## Coverage and interpretation

Fund Lens searches the free [MFapi catalogue](https://www.mfapi.in/) across Indian fund houses, including historical schemes. Search by name or AMFI code; Direct/Regular and Growth/IDCW variants are grouped by underlying family. Exact names rank first. Catalogue presence does not guarantee available holdings.

Holdings load from Tickertape's public website API, with Groww as an independent fallback after exact family matching. Both work without API keys but have no published service guarantee. Stock ISINs, weights and reporting dates are checked. Tickertape equity totals must reconcile with its latest dated asset allocation; this date basis is shown in source details. Unresolved equities and excluded NAV weights are explicit. Live samples from eight fund houses are recorded in the [research and resume checkpoint](../../docs/FUND_OVERLAP_PROGRESS.md).

Five official PPFAS July 2026 snapshots remain available as local reference examples. Their immutable IDs and older Groww share links remain supported. New national comparisons use AMFI scheme-code links. Debt, gold and fund-of-funds look-through remain unsupported.

Only disclosed positive-weight physical listed equities are included. Foreign shares and physical arbitrage legs are included; cash, debt, derivatives, fund units and REIT/InvIT units are excluded. No hedge netting or look-through. Source `$0.00%` entries are below disclosed precision and omitted with a count. The interface shows the included percentage of NAV. Sector view uses the source's **industry** labels, not a separately inferred classification.

Default **equity composition** rescales included equities to 100%; **disclosed NAV weights** preserves original percentages. All metrics use the chosen basis. Unique holdings occur in just one active fund; common-to-all and repeated-in-two-or-more are separate views. Top-ten intersection counts securities and reports each fund's actual top-list size. The headline is average pair overlap, not a portfolio risk score. Removing a fund is a local simulation, not an investment recommendation.

## National reference cache and refresh

Public reference data is stored under `DATA_DIR/fund-overlap-cache`, separate from Chambers SQLite. Versions have SHA-256 checksums and immutable filenames; pointers publish last. A failed refresh or regressed date retains the last good portfolio and shows an explicit stale warning. Portfolio/catalogue/metadata refresh after 24 hours on demand; stock identifiers cache for 7 days. Old versions are retained; storage cleanup remains manual. No comparison amounts, accounts or credentials are stored there.

```powershell
npm.cmd run refresh:funds:national
```

This refreshes previously saved national schemes and reports failures with a nonzero exit code. It does not configure a scheduler. Legacy Groww links use the original memory-only cache. The public website providers can change or be unavailable; missing holdings produce a clear error instead of an invented overlap score.

## Official PPFAS source refresh

Python 3.13 and a development-only spreadsheet dependency are needed to refresh. The serving app retains zero third-party runtime dependencies.

```powershell
python -m pip install -r apps/fund-overlap/ingestion/requirements.txt
python -m unittest discover -s apps/fund-overlap/tests -p test_ingestion.py
npm.cmd run refresh:funds
node --test tests/fund-overlap.test.js
```

Each refresh reads the official index, selects the latest non-future XLSX for each supported scheme, validates the internal fund/date/column layout, percentage units, ISIN check digits, equity weights and 100% whole-portfolio total. It aggregates duplicate ISINs and rejects conflicting industries. Every snapshot includes source URL, retrieval time, source SHA-256 and adapter version. The index also carries the snapshot SHA-256.

All five sources must pass before the index is atomically replaced. Missing/broken sources throw an error and retain the previous index. Unchanged source checksums reuse existing artifacts. Date regressions are rejected. Content-versioned snapshots are never overwritten; a source correction gets a new version. Do not delete old versions while browsers may reference them. Snapshots retain their actual dates after failed refreshes. A warning appears after 45 days, and different portfolio dates are flagged.

`.github/workflows/refresh-holdings.yml` checks on the 2nd, 6th, 10th and 12th each month and on manual dispatch. It runs source tests, refreshes, validates the generated data and uploads a **verified-fund-holdings** artifact. It does not automatically copy files into the Windows deployment or commit data. GitHub scheduling begins only once this workflow is on the remote default branch. For this local host, run the refresh command here to publish the index without restarting Node; alternatively review and copy a validated workflow artifact, copying the index last. Automatic unattended delivery to the Windows host is not configured.

## Access, privacy and cache

The platform shell is public, while `/api/fund-overlap/*` requires a session and Fund Lens grant. Backend routes validate index/snapshot paths, AMFI scheme codes and legacy Groww slugs; upstream hosts are fixed and credentials are never forwarded. There is no comparison POST API. Selections stay in browser memory, and share links put scheme IDs and basis in the fragment. No investment amounts, PAN, folio or bank details are collected. Individual public snapshot downloads are visible to the origin; shared platform session cookies still apply.

Data responses use `private, max-age=0, must-revalidate`, `Vary: Cookie` and SHA-256 ETags. Authentication and grants are checked before conditional 304 responses, so revoked grants cannot fetch cached data anew. Already downloaded data in an open browser cannot be recalled. This is a deliberate change from public CDN caching in the standalone document: it preserves platform app-access enforcement. Static app JS/CSS revalidate through the platform's existing asset handler.

## Validation and operation

```powershell
npm.cmd test
npm.cmd run test:fund-overlap
npm.cmd run test:e2e
```

API/browser tests use isolated temporary SQLite databases. Public source fixtures under `tests/fixtures` are official July 2026 XLSX files; no user data is included. Golden totals guard omissions or accidental inclusion of debt. Browser tests cover the portal launch, private gate, selection, both bases, filters, minimum-two simulator, shared links, CSV, printing, missing-source retry, 320/768/1440px layouts, and light/dark/system preferences.

No app database schema is needed: holdings are versioned public reference artifacts, not user business records. Shared auth/access/preferences remain in `data/chambers.sqlite`. Hosting uses the platform's current Windows Node process behind Cloudflare Tunnel. It requires the computer to remain running and connected; see `docs/DEPLOYMENT.md`.
# Performance, exposure, SIP and watchlists

## Personal portfolio tracker

**My portfolio** records actual statement transactions in private per-account SQLite tables. Use BUY for purchases/SIPs, SELL for redemptions, and DIVIDEND (zero units) for cash distributions. Enter the exact AMFI plan, date, actual units and cash paid/received. Plan-code search, editing, deletion, filtering and personal CSV export are available.

CSV columns: `scheme_code,date,type,units,amount,reference`. Dates are YYYY-MM-DD; reference is optional. Download the template, preview the import, then save it. Imports are atomic and skip exact duplicates; overselling and stale-tab edits are rejected. Limits: 500 rows/1 MB per import, 50 schemes and 10,000 transactions per account. Broker-specific files/PDFs require conversion. No broker link is made.

Current valuation uses available dated NAVs; aggregate values require a common date after all recorded transactions. Total gain is current value plus redemptions/distributions minus purchases. Actual dated cash flows determine XIRR; missing data or ambiguous/no detected solutions are explicit. These are not tax/FIFO calculations. Corporate actions and transfers are not automatically reconciled.

Portfolios persist in the existing database and are included in full SQL backups. Chambers JSON backups do not include portfolio transactions; export your personal CSV as needed. Full database backups remain administrator-accessible. [Implementation and release checkpoint](../../docs/FUND_PORTFOLIO_PROGRESS.md).

**Historical risk comparison** appears after loading Growth-plan NAV history. It shows annualised daily volatility, largest observed NAV drawdown, and recovery of that drawdown during the selected performance period. Sparse history produces an explicit unavailable volatility value; missing NAVs can hide larger falls. Methodology is expandable in the interface.

**Rolling returns** compares completed monthly observations over all shared history, using separate 1/3/5-year windows. It shows lowest, median and highest annualised returns plus the share of positive windows. The date selector reveals the exact start/end and return for each plan. Plans use identical dates; endpoint gaps over seven days are skipped. These overlapping historical samples are not future probabilities.

Open **Performance comparison** above the overlap selector to search exact MFapi plans. Direct and Regular plans remain separate for returns. Compare up to four Growth options over 1/3/5 years on shared NAV dates; short histories and distribution options produce explicit errors. NAV history is validated, cached for 24 hours and served only to authorised Fund Lens users.

After loading history, **Historical SIP simulator** uses a monthly amount and start/end dates. Month-end dates are clamped to the month length, purchases use the next available NAV (maximum seven-day gap), and valuation uses the last NAV on/before the end date. XIRR uses actual simulated cash-flow dates. Taxes, exit loads and transaction charges are excluded; this is historical simulation, not a forecast.

**Your saved watchlists** saves up to 10 lists of four exact plans to the signed-in user's SQLite preferences. Reload a list, fetch its latest available dated NAV, or delete it. These are private per user; entered allocation/SIP amounts are not saved or sent to providers.

In overlap results, **Combined exposure** applies entered fund values to original disclosed NAV weights and aggregates stocks by ISIN and industries by published label. Excluded coverage is shown separately; it is not treated as cash. Existing stale/partial/source-date notices still apply.

Release checkpoints: [feature progress](../../docs/FUND_LENS_FEATURE_PROGRESS.md).

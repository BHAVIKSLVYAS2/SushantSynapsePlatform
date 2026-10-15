# Fund Lens

**Release status (2026-10-07):** Laptop-independent comparison is deployed on [Fund Lens](https://apps.sushantsynapse.com/fund-overlap). Live Chrome verified comparison without backend requests at mobile and desktop sizes.

Fund Lens lives at `/fund-overlap` and in the platform catalogue. Anyone can open it without a platform login, including comparison share links. The interface focuses on public holdings overlap, industries, unique contributions and what-if fund combinations.

## Coverage and interpretation

The older-name discovery and retry improvements described below are live with implementation commit `4ef29b1`; production search and browser comparison checks passed.

The national catalogue includes historical schemes; a listing does not guarantee available holdings or establish that a scheme is active. Search matches words instead of unrelated substrings. Verified previous names for HDFC Top 100/200 and SBI Bluechip lead to their current catalogue families and display the former names. These discovery aliases do not relax holdings identity validation. References: [HDFC scheme document](https://portal.amfiindia.com/spages/873.pdf), [HDFC Top 200 change](https://files.hdfcfund.com/ImpDocs/2_HDFC_Top_200_Fund.pdf), [SBI factsheet](https://www.sbimf.com/docs/default-source/scheme-factsheets/sbi-blue-chip-fund-factsheet-august-2025.pdf?sfvrsn=d1496a6e_2). A source failure preserves completed public identifier checks for an explicit retry; it never produces an incomplete comparison.

Fund Lens searches the free [MFapi catalogue](https://www.mfapi.in/) across Indian fund houses, including historical schemes. Search by name or AMFI code; Direct/Regular and Growth/IDCW variants are grouped by underlying family. Exact names rank first. Catalogue presence does not guarantee available holdings.

Holdings use the validated official-disclosure library when available, with Tickertape and Groww as independent secondary sources after fund identity checks. The official library includes 592 portfolios across 22 fund houses, dated 30 September 2026; its coverage register distinguishes fund-house discovery, file downloads and verified scheme holdings. An official-library view works without secondary-source requests. Stock ISINs, weights and reporting dates are checked, and missing or excluded coverage remains explicit. Secondary website endpoints require no API keys but have no contracted availability. See the [core-product contract](../../docs/FUND_LENS_CORE_PRODUCT.md) and [release evidence](../../docs/FUNCTIONALITY_LEDGER.md) for source maintenance and verification boundaries.

The original five PPFAS IDs and their July/September 2026 immutable versions remain supported. The new official library adds other fund houses only after disclosure validation. National comparisons also support AMFI scheme-code links. Debt, gold and fund-of-funds look-through remain outside this physical-equity comparison.

Only disclosed positive-weight physical listed equities are included. Foreign shares and physical arbitrage legs are included; cash, debt, derivatives, fund units and REIT/InvIT units are excluded. No hedge netting or look-through. Source `$0.00%` entries are below disclosed precision and omitted with a count. The interface shows the included percentage of NAV. Sector view uses the source's **industry** labels, not a separately inferred classification.

Default **equity composition** rescales included equities to 100%; **disclosed NAV weights** preserves original percentages. All metrics use the chosen basis. Unique holdings occur in just one active fund; common-to-all and repeated-in-two-or-more are separate views. Top-ten intersection counts securities and reports each fund's actual top-list size. The headline is average pair overlap, not a portfolio risk score. Removing a fund is a local simulation, not an investment recommendation.

## National reference cache and refresh

Public reference data is stored under `DATA_DIR/fund-overlap-cache`, separate from Chambers SQLite. Versions have SHA-256 checksums and immutable filenames; pointers publish last. A failed refresh or regressed date retains the last good portfolio and shows an explicit stale warning. Portfolio/catalogue/metadata refresh after 24 hours on demand; stock identifiers cache for 7 days. Old versions are retained; storage cleanup remains manual. No comparison amounts, accounts or credentials are stored there.

```powershell
npm.cmd run refresh:funds:national
```

This refreshes previously saved national schemes and reports failures with a nonzero exit code. It does not configure a scheduler. Legacy Groww links use the original memory-only cache. The public website providers can change or be unavailable; missing holdings produce a clear error instead of an invented overlap score.

## Official PPFAS source refresh

For national official-source maintenance, install the pinned requirements and run `npm.cmd run refresh:funds:official`. The registry covers AMFI's fund-house directory; not every listed source has a usable automatic download or supported workbook. `official-index.json` atomically publishes validated snapshots and embeds its complete coverage audit. Individual failures preserve prior valid snapshots and reporting dates; corrected disclosures get new immutable versions. The existing PPFAS-only command below remains available for compatibility. Public reference refresh never opens the business database.

Python 3.13 and the pinned development-only spreadsheet dependencies are needed to refresh. Spreadsheet parsing adds no serving-app dependency.

```powershell
python -m pip install -r apps/fund-overlap/ingestion/requirements.txt
python -m unittest discover -s apps/fund-overlap/tests -p test_ingestion.py
npm.cmd run refresh:funds
node --test tests/fund-overlap.test.js
```

Each refresh reads the official index, selects the latest non-future XLSX for each supported scheme, validates the internal fund/date/column layout, percentage units, ISIN check digits, equity weights and 100% whole-portfolio total. It aggregates duplicate ISINs and rejects conflicting industries. Every snapshot includes source URL, retrieval time, source SHA-256 and adapter version. The index also carries the snapshot SHA-256.

All five sources must pass before the index is atomically replaced. Missing/broken sources throw an error and retain the previous index. Unchanged source checksums reuse existing artifacts. Date regressions are rejected. Content-versioned snapshots are never overwritten; a source correction gets a new version. Do not delete old versions while browsers may reference them. Snapshots retain their actual dates after failed refreshes. A warning appears after 45 days, and different portfolio dates are flagged.

`.github/workflows/refresh-holdings.yml` checks on the 2nd, 6th, 10th and 12th each month and on manual dispatch. It runs all ingestion tests, restores the latest successful same-branch artifact with generation/hash/date validation, refreshes official sources, validates references, builds the public assets and retains a **verified-fund-holdings** artifact for 90 days. Its existing deployment step runs only when the two Cloudflare repository secrets are configured. Remote scheduling, secret configuration and successful unattended delivery remain unverified. Local Node reads the latest atomic pointer; Cloudflare reference updates require deployment. No runtime account, document or record data enters the artifact.

## Access, privacy and cache

Fund reference APIs are public. Backend routes validate snapshot paths, AMFI codes and Groww slugs; upstream hosts are fixed and credentials are never forwarded. Comparisons stay in browser memory. Share links contain public scheme IDs and the selected basis, and work without login. No investment amounts, PAN, folio or bank details are collected by the comparison interface.

Reference responses retain conservative revalidation and SHA-256 ETags. Private legacy portfolio/watchlist APIs still require a session and Fund Lens app access. Their SQLite records and SQL backup support are preserved. Chambers and platform preferences remain authenticated.

## Validation and operation

```powershell
npm.cmd test
npm.cmd run test:fund-overlap
npm.cmd run test:e2e
```

API/browser tests use isolated temporary SQLite databases. Public source fixtures under `tests/fixtures` are official July 2026 XLSX files; no user data is included. Golden totals guard omissions or accidental inclusion of debt. Browser tests cover the portal launch, anonymous access, selection, both bases, filters, minimum-two simulator, shared links, CSV, printing, missing-source retry, 320/768/1440px layouts, and light/dark/system preferences.

The public comparison runs on Cloudflare without the laptop backend. The prepared official-data release serves verified holdings directly and retains bounded secondary-provider verification. The published national catalogue can support discovery during MFapi outages, with its audit date displayed. Public edge caches retain last-good secondary references for up to 30 days but may be evicted earlier. Official reference updates require a frontend redeployment. Internet and source availability still apply to uncached secondary portfolios.

Shared auth/access/preferences and preserved private portfolio/watchlist records retain the platform's existing SQLite/SQL Server/D1 deployment boundaries and authorization. This official-reference expansion introduces no business-data migration. See `docs/DEPLOYMENT.md` and the functionality ledger for production status.
## Scope cleanup (2026-09-26)

Removed the personal transaction/import interface, performance/risk/rolling-return panels, SIP simulator, saved-watchlist panel and amount-based exposure calculator from the served app. The public comparison retains search, 2?8 funds, overlap, holdings/industry views, what-if combinations, source provenance, share links, holdings report export and printing.

Existing portfolio/watchlist records, schemas, authenticated compatibility APIs and their regression tests remain preserved. Official source spreadsheet ingestion is a maintainer data-refresh tool, not a user upload feature; it remains necessary for verified reference snapshots.

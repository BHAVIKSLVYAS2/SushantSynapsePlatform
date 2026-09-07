# Fund Lens

Fund Lens lives at `/fund-overlap` and in the platform catalogue. Owners can launch it immediately. Owners grant other users access through **Team access → Fund Lens**. Roles are read-only inside this app; it creates no financial records.

## Coverage and interpretation

The initial source adapter supports five PPFAS schemes: Flexi Cap, ELSS Tax Saver, Large Cap, Conservative Hybrid and Dynamic Asset Allocation. The original verified release uses **31 July 2026** disclosures from the [official PPFAS portfolio archive](https://amc.ppfas.com/downloads/portfolio-disclosure/index.php). It does not claim coverage of other AMCs or live portfolios. Scheme IDs identify underlying portfolios, not direct/regular or growth/IDCW variants.

Only disclosed positive-weight physical listed equities are included. Foreign shares and physical arbitrage legs are included; cash, debt, derivatives, fund units and REIT/InvIT units are excluded. No hedge netting or look-through. Source `$0.00%` entries are below disclosed precision and omitted with a count. The interface shows the included percentage of NAV. Sector view uses the source's **industry** labels, not a separately inferred classification.

Default **equity composition** rescales included equities to 100%; **disclosed NAV weights** preserves original percentages. All metrics use the chosen basis. Unique holdings occur in just one active fund; common-to-all and repeated-in-two-or-more are separate views. Top-ten intersection counts securities and reports each fund's actual top-list size. The headline is average pair overlap, not a portfolio risk score. Removing a fund is a local simulation, not an investment recommendation.

## Source refresh

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

The platform shell is public, while `/api/fund-overlap/*` requires a session and Fund Lens grant. Backend routes allow only the index and content-versioned snapshot names. There is no comparison POST API. Selections stay in browser memory, and share links put scheme IDs and basis in the fragment. No investment amounts, PAN, folio or bank details are collected. Individual public snapshot downloads are visible to the origin; shared platform session cookies still apply.

Data responses use `private, max-age=0, must-revalidate`, `Vary: Cookie` and SHA-256 ETags. Authentication and grants are checked before conditional 304 responses, so revoked grants cannot fetch cached data anew. Already downloaded data in an open browser cannot be recalled. This is a deliberate change from public CDN caching in the standalone document: it preserves platform app-access enforcement. Static app JS/CSS revalidate through the platform's existing asset handler.

## Validation and operation

```powershell
npm.cmd test
npm.cmd run test:fund-overlap
npm.cmd run test:e2e
```

API/browser tests use isolated temporary SQLite databases. Public source fixtures under `tests/fixtures` are official July 2026 XLSX files; no user data is included. Golden totals guard omissions or accidental inclusion of debt. Browser tests cover the portal launch, private gate, selection, both bases, filters, minimum-two simulator, shared links, CSV, printing, missing-source retry, 320/768/1440px layouts, and light/dark/system preferences.

No app database schema is needed: holdings are versioned public reference artifacts, not user business records. Shared auth/access/preferences remain in `data/chambers.sqlite`. Hosting uses the platform's current Windows Node process behind Cloudflare Tunnel. It requires the computer to remain running and connected; see `docs/DEPLOYMENT.md`.

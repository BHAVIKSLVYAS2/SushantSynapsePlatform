# Fund Lens official-data product

Fund Lens targets nationwide Indian mutual-fund discovery and factual comparison of disclosed physical equity holdings. It must distinguish a catalogue listing from an available, validated portfolio. Historical schemes and Direct/Regular/Growth/IDCW options appear in the national catalogue; those options do not represent distinct underlying portfolios or prove that a scheme is still active.

The official-data release includes 592 validated portfolios across 22 fund houses, with holdings dated 30 September 2026. Unattended delivery and complete holdings coverage are separate checks, not implied by implementation. Production release status and test evidence belong in `FUNCTIONALITY_LEDGER.md`.

## Data and comparison contract

The maintained source registry is `apps/fund-overlap/ingestion/official-sources.json`, based on AMFI's portfolio-disclosure directory. A directory link, successful page request and downloaded workbook have different verification statuses. Only workbook-level identity, date, ISIN and weight validation establishes an included official portfolio. Source failures remain visible.

Official portfolios include disclosed positive-weight physical listed equities, with reporting date, industry, ISIN and percentage of NAV. Cash, debt, derivative legs, fund/REIT/InvIT units and unlisted equities are excluded; there is no hedge netting or fund-of-funds look-through. Hybrid and equity-savings funds are supported when they disclose usable physical equities. Zero or unsupported equity coverage is never rendered as a zero-overlap result. Industry similarity uses the publisher's labels and identifies unknown/mixed labels.

Equity composition normalizes included equities to 100%; NAV weighting retains their disclosed percentages. Pairwise overlap is the sum of the lower weight for every shared ISIN. The headline is an unweighted mean of pairs, not a personal risk score. Comparisons support 2–8 distinct underlying portfolios. Only trailing plan/option names are stripped for official identity resolution: interior words such as Growth remain significant.

## Refresh and recovery

Install the pinned development-only spreadsheet requirements, then run:

```powershell
python -m pip install -r apps/fund-overlap/ingestion/requirements.txt
npm.cmd run test:ingestion
npm.cmd run refresh:funds:official
```

The network fetcher accepts repository-owned HTTPS hosts only, verifies redirects and public DNS answers, and bounds response bytes, documents, archive expansion and workbook dimensions. Public read-only listing POSTs are permitted only through explicitly registered publisher endpoints and bodies; no visitor URLs, cookies or account credentials are forwarded. Legacy XLS and XLSX payload signatures are checked independently of filename extensions. Unknown layouts fail closed.

`official_refresh.py` supports `--output`, `--sources`, `--catalogue-file`, `--source-dir`, `--as-of`, `--only` and `--max-sources`. Fixture runs require a catalogue file and use isolated output directories. Live verification artifacts must also use an isolated `.publish` directory before their validated public snapshots are copied into app-owned reference data. These commands never open Chambers persistence.

Immutable snapshots are written first. `official-index.json` is the atomic publication point and embeds the complete coverage report and generation identifier. `coverage.json` is a report artifact, not a second runtime commit. Failed source refreshes retain prior valid snapshots with their original dates and explicit retained/stale status. An identical source file reuses a previously validated version; corrected files create new content versions. Date regressions and hash collisions cannot replace valid snapshots. Public reference versions are separate from accounts, business records and document blobs.

The existing five PPFAS IDs and original versioned URLs remain supported. The Node API serves validated immutable public files. Cloudflare packages current and historical snapshots as explicitly validated static assets; compact catalogue indexes and coverage metadata belong in the Worker. Arbitrary repository or runtime files are never exported. Production reference changes require a reviewed frontend build/deployment.

The supplied GitHub Actions workflow tests and refreshes the official registry on the 2nd, 6th, 10th and 12th of each month, uploads the audited artifact for 90 days, and deploys only when its two existing Cloudflare secrets are configured. Before refreshing, it restores the latest successful same-branch artifact after validating its generation, snapshot hashes and non-regressing dates. This preserves last-good references and old shared URLs across clean CI checkouts. Expired or absent artifacts fall back to repository references. Presence of the workflow is not evidence of remote scheduling or successful delivery.

To restore a verified public artifact locally, use `python apps/fund-overlap/ingestion/restore_official.py --from-artifact <artifact-directory>`. Recovery validates the entire publication before writing immutable files and replacing the pointer; a newer repository publication takes precedence.

## API and user experience

- `GET /api/fund-overlap/fund-index.json`: merged verified official library, preserving the original PPFAS references.
- `GET /api/fund-overlap/coverage.json`: dated audit counts and per-fund-house statuses; initial response remains small.
- `GET /api/fund-overlap/coverage/schemes?q=...&status=...&offset=...&limit=...`: scheme audit pages, maximum 200 rows. Counts include plan/options and historical records. `verifiedPortfolios` counts distinct published official portfolios.
- `GET /api/fund-overlap/search?q=...&offset=...`: national discovery, with verified official entries preferred and explicit holdings status. If live MFapi search fails, the published catalogue remains searchable and displays its audit date.
- `GET /api/fund-overlap/scheme/<AMFI-code>`: mapped official portfolio first, then the existing validated Tickertape/Groww sources when official holdings are unavailable.

Official holdings, source hashes, reporting dates, inclusion/exclusion weights, CSV, print and public share links remain available. Search and comparison are public; preserved private portfolio/watchlist APIs retain shared authentication, ownership and role enforcement. Comparison selections are transient and collect no investment amounts, PAN, folio or bank details.

The official-library view pages locally and does not call a secondary source. Coverage failure does not block an otherwise usable comparison. Light/dark/system themes and phone layouts remain part of the product contract. Coverage counts describe the dated audit; individual portfolio age continues to be checked when interpreting results.

## Fees and remaining boundaries

The verified official downloads require no provider subscription. Engineering, maintenance, hosting/storage limits and each publisher's applicable reuse terms still matter. Public access is not a representation of unrestricted republication rights. No paid provider, advisory service, trading account or court connection is introduced.

The registry is the national coverage target, not a guarantee that every AMC exposes an automatically discoverable spreadsheet. Dynamic, missing, inaccessible, ambiguous and unsupported sources remain explicitly recorded. Expanding a source requires a current official download, independently reviewed parser evidence and fixtures. Debt/gold comparison, fund look-through, active-status certification and personalized recommendations require separately scoped work.

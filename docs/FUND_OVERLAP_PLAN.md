# Fund Lens implementation plan

Based on the supplied Mutual Fund Overlap Analyzer Implementation Plan.

## Product decisions

Add `apps/fund-overlap` at `/fund-overlap`, using shared sign-in, theme and owner-managed grants. This adapts the document's anonymous standalone design to the platform's existing access model. No separate identity or investment account is introduced.

Fund selection and calculations stay in browser memory. Share public scheme IDs in a URL fragment, never PAN, folio, balances or investment amounts. Public disclosure artifacts are served behind the app grant. No comparison database or workspace business writes are needed; existing SQLite data is preserved.

Start with five PPFAS equity/hybrid schemes from official monthly spreadsheets. Direct/regular and growth/distribution variants share a portfolio, so they are not duplicated. Additional AMCs require separate adapters.

## Delivery sequence

1. Discover official XLSX links; parse dated equity sections, aggregate ISINs, validate totals; retain URL/fetched time/SHA-256; publish content-versioned snapshots and atomically replace the index. Failed refreshes retain the last good index.
2. Pure browser engine for 2–8 funds: weighted overlap, pair matrix, common and unique holdings, top-ten intersection, industry similarity, unique contribution, freshness warnings and temporary exclusions.
3. Searchable fund cards, selection tray, summary, matrix, holdings filters, industry view, provenance, share links, CSV and print; mobile-first light/dark/system themes using CSS tokens.
4. Golden formula tests, real XLSX parser tests, failure preservation, cache/ETag and access-control API tests, Chrome workflows and responsive checks.
5. Document refresh and operations; back up SQLite, restart the public app, verify HTTPS and existing apps, then commit reviewed changes.

## Measurement policy

Include positive-weight physical listed equities (including foreign shares and physical arbitrage legs) with valid ISINs. Exclude cash, debt, derivatives, fund units and REIT/InvIT units. No derivative netting or fund look-through is claimed. Show included NAV weight per fund. Gross physical overlap is not matching net risk exposure, particularly for hybrid/hedged funds.

Default equity composition weights divide each included equity weight by that fund's equity total and multiply by 100. Pair overlap sums the per-ISIN minima. An explicit NAV basis retains disclosed percentages; matrix diagonals then equal included NAV weight. Industry similarity uses source industry labels, excluding unknown classifications. Top-ten uses included equities. Unique means present in just one active fund. The multi-fund summary reports average pair overlap, not a personalized portfolio score.

## Refresh and hosting

Use the existing Windows/Cloudflare Tunnel deployment. Authenticated data uses private revalidation with ETags, checking access before every response. Content-versioned snapshots are never overwritten. A scheduled GitHub Actions workflow generates tested artifacts for review; automatic publication to the Windows host is not implied. The operator can run the same refresh command locally. Source failures keep the previous verified data available with visible dates.

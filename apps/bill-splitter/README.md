# bill-splitter

Local refinement adds percentage and relative-share methods, BigInt remainder
allocation and 1–100 expenses per trip. The chosen split applies to the combined
total. Stable transient person IDs retain payer selections on renames; referenced
payers must be reassigned before removal. Copy output includes the trip title and
expense breakdown. Engine coverage: tests/bill-trip-arrangements.test.js. Browser
coverage: apps/bill-splitter/tests/browser.spec.js. This refinement is not deployed.

Validates 2–20 distinct names and amounts in whole paise. Supports equal shares (remainder paise assigned in input order) or exact individual amounts. Creditor/debtor settlements conserve the total and do not transfer money. Inputs/results remain in the tab; copying is explicit. Engine properties are tested in `tests/public-quick-wins.test.js`; UI and copy fallback in `apps/qr-maker/tests/browser.spec.js`.

App-owned frontend, public registry entry and static allowlist. Shared presentation and download/copy helpers are in packages/ui/local-tools.*. No backend, database schema or provider setup is required. Deployed and live-verified on 2026-10-16; release details are in docs/FUNCTIONALITY_LEDGER.md.

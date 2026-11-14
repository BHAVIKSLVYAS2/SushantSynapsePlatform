# Kiraya Saathi

A personal rent ledger for owners of flats and shops. The user explicitly chose
browser-only storage, no login and backups on 14 November 2026. This exception
applies only to Kiraya Saathi; existing SQLite/D1 applications remain unchanged.

## Ownership and storage

`apps/kiraya-saathi/frontend/engine.mjs` owns validated rental commands and exact
integer-paise calculations. `storage.mjs` owns IndexedDB `synapse-kiraya-saathi`,
version 1, and revision-checked atomic writes/import. `app.mjs` owns the interface;
`receipt.mjs` renders payment PDFs through the shared landscape A4 encoder.
Server static routes use an explicit asset allowlist. The shared app registry owns
home discovery and navigation. There is no rental business API or database schema.

Records belong to this browser profile, accessible to anyone using that profile.
They do not sync with an account or another device. Clearing site data removes
them. Backups contain personal and financial information; export them regularly.
Import validates all rows, IDs, relationships, amounts, bill balances and deposit
balances, then asks before replacing this app's workspace. Stale tabs cannot
overwrite a newer revision. No Hisabio, JapSeva or server records are imported,
reset or shared. Browser persistence does not guarantee offline asset loading.

## Available workflows

- Add flats and shops, addresses and successive tenancies with non-overlapping dates.
- This month shows expected, received and pending rent. Earlier arrears are shown
  separately. Search by property or tenant; settle a selected month in its ledger.
- Monthly bills are prepared on opening through the current month, including
  missed months since tenancy start. Issuance is idempotent, not a background job.
- Rent and maintenance use full calendar-month amounts. No automatic proration.
  Add a dated, explained reduction for any agreed first/last part-month concession.
  Extra charges (such as electricity) and reductions remain in the bill's audit trail.
- Effective-month rent changes apply only to later, unissued bills. Historical
  bills retain their original rent and maintenance. Due days beyond a month's end
  clamp to its last date.
- Record partial or full payments for one bill. Overpayment and reductions below
  already-paid amounts fail. A wrong payment can be voided with a reason, retaining
  its entry and reopening the balance. No real money moves through the app.
- Download a real PDF or print a receipt for an individual non-void payment. A
  partial-payment receipt acknowledges only that amount. Set the owner's name in
  Backups. Downloaded or printed receipts cannot be recalled after voiding.
- Track agreed deposits and actual receipts/refunds/deductions separately. Dated
  refunds/deductions cannot exceed money held. Deposits never settle rent silently.
- Move-out keeps past bills, payments and deposits. A backdated move-out removes
  only untouched later generated bills; later bills with payments or adjustments
  prevent closure so their history is not discarded. Add the replacement tenancy
  while the previous tenant's balances remain accessible in History.
- Record owner repair/other expenses against a property, separate from tenant bills.
- Prepare a reminder message to copy, or open a WhatsApp draft when a usable phone
  is entered. The user reviews and sends it. No delivery provider is connected.
- Export/import JSON backups and download a spreadsheet-safe rent ledger CSV.

## Boundaries and verification

The initial interface is English. It uses the platform's theme tokens and shared
navigation, with mobile layouts, labelled native forms, modal keyboard controls
and reduced-motion support. Artwork is original SVG; there are no new dependencies.

Limits: 100 properties, 500 tenancies, 12,000 bills, 20,000 payments, 10,000 deposit
entries, 10,000 owner expenses, 200 adjustments/rate changes per record, 5 MB backup
and ₹100,000,000 per stored amount/bill. No general record deletion, payment gateway,
automatic messaging, tenant portal, agreement drafting, tax calculation or PG beds.
Receipts record owner-entered payments; they have no digital signature or public
verification. Kiraya Saathi is a working product name, not trademark clearance.

Model and Chrome workflow tests are in `tests/kiraya-saathi.test.js` and
`apps/kiraya-saathi/tests/browser.spec.js`. Actual verification/release status is
recorded in the functionality ledger.

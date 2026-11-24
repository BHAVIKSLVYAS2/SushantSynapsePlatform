# BatchFee Lite

Open `/batchfee-lite` from the public catalogue without signing in. A browser
profile keeps its own academy and append-only event history in IndexedDB.
The fee engine validates amounts in integer paise. Storage transactions check
revisions and request IDs so outdated tabs cannot silently overwrite newer
changes.

Export a JSON backup from More. Restore accepts an exact-compatible backup or
an older organisation backup into an empty workspace, validates every event,
and prevents conflicting history from replacing newer records. Browser records
have no cloud sync or account dependency.

Node and Workers retire all old BatchFee server routes with HTTP 410. The SQL
cleanup file is an explicitly authorised, one-time production data-retirement
tool and is never run automatically.

Entities: academy, batches, students, enrolments, immutable fee obligations, payments, allocation entries, reversals, expenses, editable reminder templates. Family membership is explicit, never inferred from names.

Monthly/quarterly fees catch up through the current month when opened. Due days clamp to month-end. Joining month is charged in full with due date no earlier than joining; waive and replace with a manual charge for concessions. Course/one-time fees generate once. Per-class/custom charges require explicit entry. Paused students optionally keep generating; otherwise cursors advance without fees. Inactive students/batches stop future generation. Settings changes first catch up existing obligations, then apply prospectively. Reactivation never back-bills skipped periods.

Payments allocate oldest dues first. Excess remains traceable credit and applies to future obligations. Request keys prevent duplicates. Reversals preserve payments/receipts and require reasons. Waivers affect only unpaid balances. No deletion of financial history.

Screens include Home, Students, Batches, Fees, Notifications, and More for
history, expenses, reports, settings, import, and recovery. Print supports
Save as PDF and CSV exports are Excel-friendly. WhatsApp opens editable drafts
for the user to send.

## Start using it

Run `npm.cmd start` at the repository root and open `/batchfee-lite`. Set the
academy name and contact details, create a batch, then add students or import
the supplied CSV template. The app has no sign-in requirement or staff accounts.
Starting it does not add demonstration records.

Payments accept full, partial or advance amounts. Open a student to see the ledger and family balance; use the same explicit family key for siblings. A payment's original receipt remains unchanged when its advance is subsequently allocated. Corrections reverse the original entry with a reason; create a separate replacement payment. Batch defaults affect new students only. New enrolments on an existing student and frequency changes begin next month. Per-class/custom charges use **Fees → Add a fee**. Course and one-time obligations generate once.

The dashboard's collected figure is cash received during the selected month,
including advances. Expected fees refer to obligations for that month. Pending
and overdue are their current remaining balances, not historic month-end
snapshots. Batch collection uses allocations; unapplied advances remain separate.
No attendance, automatic prorating, payment gateway, GST accounting or parent
portal is included.

Use **More → Backup data** frequently and retain a private copy off this device.
Restore replays validated commands inside one transaction. Older or conflicting
backups cannot erase newer entries. Uploaded logos are limited to 200 KB.
Excel workbooks must be saved as UTF-8 CSV before import; no XLSX parser is included.

Browser print provides PDF output; receipt sharing uses device sharing or
clipboard text. WhatsApp links prepare individual drafts only; send them in
WhatsApp yourself. No confidential records are sent to third-party services
automatically.

## Verification

`node --test tests/batchfee.test.js` covers recurring dates, historical snapshots,
allocation conservation, reversals, waivers, pause/reactivation, multiple
enrolments, prospective changes, deposits before joining, validation, atomic
imports, idempotency, revision conflicts and browser persistence.
`npx.cmd playwright test apps/batchfee-lite/tests` exercises mobile setup,
payments, receipts, reminders, correction/waiver, imports, expenses, exports,
themes and responsive layouts.

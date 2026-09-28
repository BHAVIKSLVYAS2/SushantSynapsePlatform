# BatchFee Lite implementation design

One private academy in existing SQLite; shared owner sign-in. Optional assigned staff access is deferred. App-owned workspace and append-only audit events are registered in full SQL exports. All mutations use immediate transactions and optimistic revisions. Money is integer paise.

Entities: academy, batches, students, enrolments, immutable fee obligations, payments, allocation entries, reversals, expenses, editable reminder templates. Family membership is explicit, never inferred from names.

Monthly/quarterly fees catch up through the current month when opened. Due days clamp to month-end. Joining month is charged in full with due date no earlier than joining; waive and replace with a manual charge for concessions. Course/one-time fees generate once. Per-class/custom charges require explicit entry. Paused students optionally keep generating; otherwise cursors advance without fees. Inactive students/batches stop future generation. Settings changes first catch up existing obligations, then apply prospectively. Reactivation never back-bills skipped periods.

Payments allocate oldest dues first. Excess remains traceable credit and applies to future obligations. Request keys prevent duplicates. Reversals preserve payments/receipts and require reasons. Waivers affect only unpaid balances. No deletion of financial history.

Screens: Home, Students/ledger/family, Batches, Fees, Notifications, More/history/expenses/reports/settings/import/recovery. Print supports Save as PDF; CSV is Excel-friendly. WhatsApp creates editable drafts, without claiming delivery. Backups are app-only; restore must preserve existing financial history. No offline editing, cloud synchronization or encrypted off-device storage is claimed.

## Start using it

Run `npm.cmd start` at the repository root and open `/batchfee-lite`. Sign in with the platform owner account. Set your academy name and contact details, create a batch, then add students or import the supplied CSV template. Existing platform accounts need no additional registration. No demonstration records are written to the live database.

Payments accept full, partial or advance amounts. Open a student to see the ledger and family balance; use the same explicit family key for siblings. A payment's original receipt remains unchanged when its advance is subsequently allocated. Corrections reverse the original entry with a reason; create a separate replacement payment. Batch defaults affect new students only. New enrolments on an existing student and frequency changes begin next month. Per-class/custom charges use **Fees → Add a fee**. Course and one-time obligations generate once.

The dashboard's collected figure is cash received during the selected month, including advances. Expected fees refer to obligations for that month. Pending and overdue are their current remaining balances, not a historic month-end snapshot. Batch collection uses allocations; unapplied advances remain separate. No attendance, automatic prorating, payment gateway, GST accounting, parent portal or multi-tenant isolation is included.

Use **More → Backup data** frequently and retain a private copy off this computer. Restore replays validated commands inside one transaction and accepts only an exact extension of existing history (or a backup into an empty BatchFee workspace). Older/conflicting backups cannot erase newer entries. Full platform SQL exports also include the app schema, workspace and history. Backups do not include platform accounts; those remain platform-owned. Uploaded logos are limited to 200 KB in the interface. Excel workbooks must be saved as UTF-8 CSV before import; no XLSX parser is included.

Browser print provides PDF output; receipt sharing uses device sharing or clipboard text. WhatsApp links prepare individual drafts only; send them in WhatsApp yourself. Staff permissions are intentionally not enabled in V1. Confidential records are not stored in browser localStorage, cached for offline use or sent to third-party services automatically.

## Verification

`node --test tests/batchfee.test.js` covers recurring dates, historical snapshots, allocation conservation, reversals, waivers, pause/reactivation, multiple enrolments, prospective changes, deposits before joining, validation, atomic imports, idempotency, revision conflicts, access checks, recovery and persistence. `npx.cmd playwright test apps/batchfee-lite/tests` exercises mobile setup, payments, receipts, reminders, correction/waiver, imports, expenses, exports, themes and responsive layouts using isolated temporary databases.

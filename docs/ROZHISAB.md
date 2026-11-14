Language follow-up (2026-11-14): care forms now support English/Hindi/Gujarati.
Kiraya also translates its rental workspace, receipt labels and reminder drafts.
Saved user content remains verbatim; unmapped validation details retain English
with localized guidance. See the functionality ledger for verification/release.

# RozHisab

Route: `/rozhisab`. Tagline: Roz ka tick, mahine ka hisab.

## Ownership and privacy

Vanilla JavaScript app under `apps/rozhisab`; no framework, paid API, AI, cloud
account, payment gateway or household-data API. The user explicitly requested
IndexedDB for this app; existing platform SQLite/D1 records remain independent.
The public app is registered in the shared catalogue, app switcher, static asset
allowlist and sitemap. Its route is excluded from the advertising allowlist, and
the shared shell uses local-only mode rather than querying account status.

`engine.mjs` owns dates, schedules, temporal configurations, attendance, amounts,
payments, closing and backup validation. `storage.mjs` owns version-2 IndexedDB
schema upgrades (preserving version-1 records) and revision-checked transactions. `copy.mjs` owns paired English,
Hindi and Gujarati interface text and follows the shared language preference.
Personal service/vendor names and notes remain literal. There is no automatic
translation or upload of these fields.

## Billing conventions

- Date-only values are local calendar dates, constructed at noon. No UTC midnight
  conversion is used. Supported input years are 2000–2099. Quantities use integer
  thousandths; monetary values use integer paise. Quantity charges and monthly
  fee components round half up once per service bill, rather than per tap/day.
- Scheduled days count as received automatically through today. Attendance saves
  exceptions, not generated daily charges. Repeated edits replace the exception,
  so repeated visits/reloads do not create duplicate charges.
- Daily, weekly, selected-weekday and monthly schedules are supported. Monthly
  days 29–31 clamp to the last day of shorter months. Unscheduled dates are never
  missed visits; explicit quantities can record additional unscheduled deliveries.
- Configurations have effective dates. Rate, schedule and activation changes
  preserve earlier configuration history. Existing service forms retain the
  original start date and apply the new revision from the selected effective date.
  Turning Active off stops future tracking while preserving service history.
- Monthly fees accrue per active calendar day in the selected billing cycle,
  including paused days. A partial current period never bills future days. An
  effective start/end date prorates a monthly fee by calendar days in that period.
- No monthly absence deduction is the default. Optional fixed-per-visit or
  proportional deductions apply only after configured paid absences. Proportional
  deduction uses the applicable monthly rate divided by scheduled visits in the
  full cycle. Deductions cannot exceed the monthly fee component.
- Vendor holidays/vacation pauses remove scheduled visits, not salary days. Thus
  pauses do not become missed visits or automatically deduct monthly salary.
- Billing cycles start on day 1–28; day 1 is a calendar month. A previous unpaid
  opening amount belongs to its service. Earlier charges/payments carry once into
  later balances. Negative balances are advances. A payment records cash/UPI/other
  already paid; it never initiates a payment.
- Completed periods can be closed with confirmation, freezing bill details and
  blocking overlapping attendance, pause, payment and configuration edits. Reopen
  later closed periods first. Cycle changes require reopening closed periods.

## Durability, recovery and offline

No household records are saved in localStorage. The single IndexedDB workspace
row is replaced only after its revision matches in the same read/write transaction.
Cross-tab changes notify other tabs. Stale writes fail; forms opened before a
cross-tab revision change require reopening. The latest local change can be undone
while its revision still matches. Storage errors do not silently fall back to an
in-memory-only workspace or erase existing data.

JSON backups contain versioned service history, exceptions, pauses, payments,
settings and closed bills. Restore validates canonical fields and recomputes closed
snapshots before replacing anything. Unsupported versions, duplicate identifiers,
invalid dates and mismatched snapshots are rejected. Restore and whole-workspace
deletion explicitly confirm; download a backup before either. Browser data clearing
removes IndexedDB too. The app requests no unnecessary household identity fields.

The service worker is served at the stable `/rozhisab-sw.js` URL, scoped to
`/rozhisab`. It precaches the public app and discovered public shell dependencies,
including release-fingerprinted imports. API requests and unrelated pages are
never cached. Offline is labelled ready only after activation. JSON data remains
in IndexedDB, not in service-worker caches. PNG PWA icons are generated from the
app-owned SVG ledger icon. Installation remains subject to browser/platform support.

Optional notifications run only while the app is open, after browser permission,
where supported. This release does not promise closed-app scheduled reminders or
background synchronization. No cloud synchronization service is connected.

## Reports and verification

Monthly bills include rates, quantities, absences, extras, deductions, prior
balances, payments and remaining balance. Copy/native share uses local bill text;
WhatsApp can be chosen from the device's share sheet where available. No automatic
message delivery. Print opens the browser print/Save as PDF workflow. CSV escapes
cells and guards spreadsheet formula prefixes; JSON preserves complete history.

Focused engine checks: `node --test tests/rozhisab.test.js`.
Chrome workflows: `npm.cmd run test:e2e -- apps/rozhisab/tests`.
Use only temporary DATA_DIR/profile fixtures. Browser cases cover actual downloads,
history/closing, cross-tab conflicts, language/theme/width states, offline reload
and reopening an actual persistent Chrome profile. Chrome emulation does not prove
testing on physical Android/iOS devices; manual device acceptance remains separate.

Release/build/deployment evidence is recorded in `FUNCTIONALITY_LEDGER.md`.

## Optional household care (14 November 2026)

Home care is an optional fifth destination; Today remains the default. Items own
purchase receipts (PDF/JPEG/PNG/WebP, up to 1 MB each), warranty dates, contacts
and notes. Service/renewal schedules support one-time or monthly repetition,
completion history, exact recorded costs and calendar exports. A linked existing
service opens its bill rather than creating another charge. Care costs never
change delivery bills or payments automatically. Archived items retain receipts
and history and can be restored. Care forms now use the selected English/Hindi/Gujarati language; existing
Hisabio language flows remain intact and the navigation label is translated.

The shared packages/care engine and packages/ui/care-workspace own reusable rules
and views only. Hisabio records remain inside its own revision-checked state and
backup. IndexedDB upgrades in place to version 2, preventing older version-1 app
tabs from dropping care data. Backup version 2 accepts old version-1 backups with
empty care records. No service, payment, closed bill or attendance migration resets
are performed. Care limits: 300 items, 600 schedules, 5,000 visits and 15 MB.
Calendar alarms depend on the calendar application after explicit import; there
is no new background notification or delivery service.

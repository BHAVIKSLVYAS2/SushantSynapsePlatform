# Ritual Assist

P17 integration (local, verified 2026-10-25): the pinned Astronomy Engine is
shared from packages/vedic/vendor via the legacy compatibility import. The public
engine URL serves the same source through the existing delivery transform.
Lunar primitives, remembrance and monthly calendar baselines remain exact. This
does not adopt Vedic's distinct time/correction/Lahiri/birthday policy. Existing
public APIs, protection, PIN rules, preparation data and storage are unchanged.
See docs/vedic/P17_EVIDENCE.md. This local refactor has not been deployed.

Public routes: /ritual-assist and /ritual-assist/calendar. Fifteen original English/Hindi preparation guides include eight Shubh and seven Ashubh ceremonies. Havan has 15 materials; Antyeshti includes adult male/female/shared considerations; days 10, 11 and 12 have separate checklists. These are general preparation summaries, not complete liturgical instructions or universal ritual obligations. Confirm quantities, substitutions, participants and local procedure with the officiant. The scoped cultural death reference's UK legal procedures do not apply to India.

Standalone checklists use one list in original item order, followed by personal additions. The left checkbox marks an item arranged; the blue right checkbox assigns it to Pandit Ji independently. Unchecked responsibility defaults to self without a label. Three-dot menus edit/delete items and expose existing preparation guidance. Quantity and unit are optional and appear inline only when provided. The header shows the chosen optional ritual date and completed/total progress. Removed guide items can be restored; the original guide content is unchanged. Extra items, edited names, quantities, arranger names, removals and the optional date stay in the existing device-local checklist storage. Checkmarks persist only with Remember checkmarks enabled. Existing arranger names are retained and remain editable. Download and print preview use the personalized list. No account/device sync or calendar calculation is introduced; calendar preparation packs retain their existing separate behavior.

## Shraddha & Barsi Calendar

The calendar entry now defaults to **Vrats & dates**, with a separate Shraddha &
Barsi tab (`/ritual-assist/calendar?view=remembrance`). The general calendar needs
only a PIN code and month, supports 2025–2030, English/Hindi, upcoming list/month
views, category filters and a next-occurrence shortcut. Seven event types are
available: Ekadashi, Amavasya, sunrise Purnima/Poonam, Purnima fasting, Sankashti
Chauth, Vinayaka Chaturthi and Pradosh. Purnima fasting can precede the sunrise
calendar date. Chauth here does not calculate named Karwa/Sakat annual rules.
The **Up Next** list hides dates earlier than today in IST. Month view retains
all events, including past dates and their details, with earlier days visually
de-emphasized. When the selected month has no future dates, the list says so
without implying the month has no events.

`POST /api/ritual-assist/observances` validates a bounded month, offline PIN,
Amanta/Purnimanta labels and the explicit Smarta household planning policy. Node
uses the existing two-thread/six-requests-per-minute calendar budget; Workers use
the existing calendar limiter and a bounded 24-entry, one-hour in-memory public
result cache keyed by location, month, convention and policy version. No saved
death record, account, new schema, external date API or scraping is involved.
`frontend/lunar-core.mjs` shares the unchanged astronomy primitives with the
remembrance engine. `backend/observances.mjs` owns public occurrence selection.

Each result records the engine/policy version and exposes local timing and its
rule. Missing/repeated sunrise tithis, skipped following-Dwadashi sunrise,
multiple moonrise candidates, close day overlaps and five-minute boundary cases
are confirmation-only and excluded from reminders. Ordinary morning Parana is
available; exceptional Parana windows are withheld. No Vaishnava/ISKCON rule,
independent priest certification, additional monthly/annual festivals, Sankranti,
calendar subscription or automatic notification delivery is claimed.

General-calendar ICS exports selected future resolved dates, with single-event
exports, optional previous-evening/day-offset alarms and separate resolved
moonrise/Parana entries. Timed reminders use 15 minutes before the event. Past
alarms are omitted; UIDs remain stable across languages and include location.
Files use individually calculated dates rather than Gregorian recurrence rules.
Import and actual alarm delivery depend on the user's calendar client and have
not been provider-verified. Inputs/results stay in transient tab memory; calendar
imports share the selected dates and PIN-area location with that provider.

Enter a past/present death date, exact IST time and a six-digit Indian PIN. The Node backend resolves approximate coordinates from its offline GeoNames directory; unknown/inconsistent PINs fail without nearest-city substitution. See [postal provenance](data/README.md). The same PIN area supplies the observance location. Optional family settings override Amanta/Purnimanta labels, civil/sunrise day counting, confirmed death tithi and day 13. Defaults are conveniences, not a determination of family tradition.

The result includes first-year Chautha, days 10–13, Masik, first Barsi and first matching Pitru Paksha after Barsi. The yearly overview has the current year and next ten display years, retaining earlier current-year dates and multiple applicable observances. Masik/Barsi/Pitru dates use lunar tithis and local Aparahna; early mourning days use inclusive day counts. The post-first-Barsi Pitru policy is explicitly selected, not universal. Ten upcoming occurrence arrays remain internally for compatibility. Changing inputs clears results; no death record is stored.

Public POST /api/ritual-assist/calendar runs in bounded Node worker threads: two concurrent calculations, six requests/address/minute and 20 seconds. Inputs undergo server validation. No SQLite write or request-body logging is introduced; hosting metadata and temporary rate limits still apply. Guides/form are served independently by Cloudflare, while a new calculation requires the backend.

## Calendar reminders

Download calendar reminders creates a local .ics file containing individually calculated resolved upcoming dates through the final displayed year. No recurring Gregorian yearly rule is used. Conditional, unresolved, expired and out-of-range dates are omitted. Each event is private, all-day and transparent, with a stable hashed UID and optional display alarm at 9am IST on the day or 1/3/7 days before. Past alarm times are omitted. UTF-8 text uses RFC 5545 escaping, CRLF and 75-octet folding.

Open/import the file into a calendar app. Google Calendar imports ICS on a computer through Settings → Import & export; choose a private calendar and check notifications afterward. Imported alarms may be ignored or changed by the calendar client. Reimporting can duplicate events. This is a one-time export, not account integration, automatic sync, notification delivery or WhatsApp automation. Importing shares included observance dates with the chosen provider. No provider account was connected or actual reminder delivery tested. [Google import instructions](https://support.google.com/calendar/answer/37118) and [RFC 5545](https://datatracker.ietf.org/doc/html/rfc5545).

## Preparation pack

Open preparation pack lets families select mourning/remembrance guides and optional Havan. Defaults: Prarthana sabha, days 10/11/12 and Shraddha. Historical and uncertain calendar dates remain visible with their status, alongside sources/custom notes, material checklists and responsibility fields. Print pack / save PDF prints only the pack, including checks and responsibility names. Download preparation pack exports UTF-8 text. Empty guide selection prevents export. All checks, names and selections remain in transient tab memory, survive language changes and clear on refresh or a new calculation/input edit. Pack checks are separate from standalone guide checks. Sharing the resulting file also shares its included death/location details and responsibility names. No business-state browser persistence is added.

## Method and limits

Vendored MIT Astronomy Engine 2.1.19 computes geocentric Moon–Sun separation; each 12 degrees is a tithi. Month classification uses a Chitra/Spica-aligned sidereal Sun, not exact Lahiri/Swiss Ephemeris. Aparahna is the fourth of five equal sunrise-to-sunset parts; maximum tithi overlap selects a date. No overlap, close overlaps and five-minute boundary guards withhold dates. Adhik/Kshaya Maas, uncertain month classification, special death tithis and family exceptions require confirmation. Postal coordinates are approximate. This is not a certified regional Panchang or priest-reviewed service. Selected published 2026 fixtures agreed within 2–3 minute tolerances; this is not exhaustive future/historical certification. See [third-party notices](THIRD_PARTY.md) and the dated content/PIN reviews in docs.

## Ownership and verification

guides.mjs and its mourning/material modules own preparation content; app.js owns guide UI. panchang.mjs owns the existing engine. calendar-export.mjs owns pure ICS export; preparation-pack.mjs owns pack selection/text; calendar-tools.mjs owns transient pack/reminder UI. Server composition stays in server/index.js; frontend files are explicitly allowlisted. No new payment, booking, provider connection, schema or recipient configuration.

Verification: node --test tests/ritual-calendar-export.test.js tests/ritual-panchang.test.js tests/ritual-pincode.test.js tests/ritual-calendar-api.test.js tests/ritual-assist.test.js and npx.cmd playwright test apps/ritual-assist/tests/browser.spec.js. Current local run: 19 Node checks and eight Chrome workflows pass. Browser tests download actual ICS/TXT/PDF, verify print isolation, bilingual retained checks/assignments, stale clearing, failure/cancellation and 320/390/1440px layouts. All API/browser tests use isolated temporary DATA_DIR values. Live evidence is recorded separately in the functionality ledger.

Temple Seedha: the Shraddha/Barsi/Samvatsari guide includes bilingual raw-food donation materials, temple acceptance/quantity questions and packing notes via `frontend/seedha.mjs`. It appears in guide checklists and calendar preparation packs. The list is conditional and source-linked; quantities and family rites must be confirmed. No calculation or persistence change.

Sensitivity review (10 October 2026): mourning guides and preparation exports include a calm family-care note without judging grief, devotion or ritual completeness. Seedha quantities remain a family example. Calendar dates are calculated planning candidates, not a certified regional Panchang; confirm before final arrangements. No independent doctrinal or astronomical certification is claimed.

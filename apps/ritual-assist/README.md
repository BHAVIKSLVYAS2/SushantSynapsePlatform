# Ritual Assist

Public routes: /ritual-assist and /ritual-assist/calendar. Fifteen original English/Hindi preparation guides include eight Shubh and seven Ashubh ceremonies. Havan has 15 grouped materials; Antyeshti includes adult male/female/shared considerations; days 10, 11 and 12 have separate checklists. These are general preparation summaries, not complete liturgical instructions or universal ritual obligations. Confirm quantities, substitutions, participants and local procedure with the officiant. The scoped cultural death reference's UK legal procedures do not apply to India.

## Shraddha & Barsi Calendar

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

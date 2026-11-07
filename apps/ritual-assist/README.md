Audit release (2026-11-07): one persistent three-section workspace now serves calendar and guides routes. Prep mounts lazily via workspace.mjs, app.js and prep-template.mjs; calendar-display.mjs keeps presentation independent of the astronomy engine. City search uses shared `/api/places`; explicit GPS matching stays local. Retired dashboard/tools UI and old standalone index.html were removed, while tested pure pack/text and active per-event ICS remain. Current verification and deployment status are in the platform functionality ledger. Older release descriptions below are historical.

# Ritual Assist

Three-section mobile workspace (2026-11-06): one compact header restores the
existing golden calendar artwork. Vrat, Shraddh and Checklist share a consistent
three-way navigation bar. Calendar forms use task labels, not repeated calendar
headings. Checklist exposes a native ritual selector and open preparation steps;
the gallery remains optional. Switching to a calendar section and back restores
the selected ritual and unfinished checks using a consumed tab-local draft.
Ordinary refresh and optional persistent checklist saving retain their existing
policy. Calculations, reminder admission, exports and saved calendar fields are
unchanged. Verification/deployment evidence is in the functionality ledger.

Calendar-first correction (2026-11-06; deployed, see the functionality ledger): `/ritual-assist`
now opens calendar generation directly, with Vrat and Shraddha/Barsi choices.
`/ritual-assist/calendar` remains supported. Puja guides and existing checklist
features live at `/ritual-assist/guides`; old `?guide=...` links forward there.
Saved calendar fields, calculations and exports retain their existing behaviour.
This supersedes the guide-first landing described in the historical entry below.

Information density release (2026-11-05; release evidence in the functionality
ledger): a compact calendar strip replaces the large guide banner; the selected
ritual, date and progress no longer repeat a second title. Share checklist and
Preview / Print remain directly available; More holds copy, text download and
guide-link sharing. Checklist settings contains saved-list deletion and the long
retention explanation, while the remember toggle and save failures stay visible.
Specific existing material notes are visible inline; repeated common advice is
shown once. Preparation & sequence retains the reviewed ceremony-specific notes,
and desktop material groups use both columns without an empty sequence sidebar.
Vrat agenda groups events by date and exposes admitted moonrise, Parana or
selection windows; full rule/tithi details and single-date reminders expand on
demand. Remembrance uses full-width editable inputs and a short result summary.
Numerical policies, uncertainty exclusions, original guide data and exports are
preserved. English/Hindi, themes, local checklists and input memory remain.

Calendar field memory (2026-11-05; included in this release): returning
visits restore the last remembrance date, IST time, confirmed city and family
options from this browser. Vrats & dates remembers its city, month and lunar-month
convention independently. Fields save as they are edited, including before a
calculation; city search text, raw GPS, results and preparation packs are excluded.
Restoring never starts geolocation or calculation. Each form offers Clear saved
fields, which clears its input memory and current results without changing the
other calendar or standalone checklists. English/Hindi copy explains device-local
retention and storage failures; malformed saved data is preserved until cleared.

Checklist usability (2026-11-05; included in this release): the
searchable guide catalogue starts collapsed behind Change ritual and closes
after selection. Selected guide URLs, learning links and browser history remain
supported. Share checklist previews the personalised text, including the optional
date, custom/edited items, quantities, responsibility names and completion state.
Native sharing, copy/manual selection and UTF-8 text download share a labelled
snapshot; later edits do not update it. Share guide link remains a separate action.
The Remember checkmarks control and browser-saving explanation now sit beside
progress and explicitly cover all rituals. Clear checkmarks retains the list and
offers Undo clear. Delete saved checklist requires confirmation, restores this
ritual's original guide and preserves other rituals. Storage failures or unreadable
saved state are labelled and never silently overwritten. No cloud sync, calendar
calculation change or new API is introduced. Verification is recorded in the ledger.

Ashubh material update (2026-10-27): the existing day 11 and day 12 checklists
include 64 and 33 English/Hindi additions from the family's Index.html and
Vertical.Html reference lists. Quantities require priest confirmation; Pagdi
entries are optional and unclear regional terms are flagged. Day 10 is unchanged.
Checklist UI and existing saved item IDs are preserved. Reference scripts, photo
services and video embeds were not imported.

P17 integration (local, verified 2026-10-25): the pinned Astronomy Engine is
shared from packages/vedic/vendor via the legacy compatibility import. The public
engine URL serves the same source through the existing delivery transform.
Lunar primitives, remembrance and monthly calendar baselines remain exact. This
does not adopt Vedic's distinct time/correction/Lahiri/birthday policy. Existing
public APIs, protection, PIN rules, preparation data and storage are unchanged.
See docs/vedic/P17_EVIDENCE.md. This local refactor has not been deployed.

Public routes: /ritual-assist and /ritual-assist/calendar. Fifteen original English/Hindi preparation guides include eight Shubh and seven Ashubh ceremonies. Havan has 15 materials; Antyeshti includes adult male/female/shared considerations; days 10, 11 and 12 have separate checklists. These are general preparation summaries, not complete liturgical instructions or universal ritual obligations. Confirm quantities, substitutions, participants and local procedure with the officiant. The scoped cultural death reference's UK legal procedures do not apply to India.

Learning sections identify daily puja, Ganesh and Lakshmi as simplified household sequences, not complete vidhi. Other ceremonies are explicitly preparation-only. Daily puja uses no deity-specific Ganesh prayer. Broader ritual instructions and mantras require tradition-specific practitioner review.

Standalone checklists use one list in original item order, followed by personal additions. The left checkbox marks an item arranged; the blue right checkbox assigns it to Pandit Ji independently. Unchecked responsibility defaults to self without a label. Three-dot menus edit/delete items and expose existing preparation guidance. Quantity and unit are optional and appear inline only when provided. The header shows the chosen optional ritual date and completed/total progress. Removed guide items can be restored; the original guide content is unchanged. Extra items, edited names, quantities, arranger names, removals and the optional date stay in the existing device-local checklist storage. Checkmarks persist only with Remember checkmarks enabled. Existing arranger names are retained and remain editable. Download and print preview use the personalized list. No account/device sync or calendar calculation is introduced; calendar preparation packs retain their existing separate behavior.

## Shraddha & Barsi Calendar

The calendar entry now defaults to **Vrats & dates**, with a separate Shraddha &
Barsi tab (`/ritual-assist/calendar?view=remembrance`). The general calendar needs
only a selected Indian city and month, supports 2025–2030, English/Hindi, upcoming list/month
views, category filters and a next-occurrence shortcut. Seven event types are
available: Ekadashi, Amavasya, sunrise Purnima/Poonam, Purnima fasting, Sankashti
Chauth, Vinayaka Chaturthi and Pradosh. Purnima fasting can precede the sunrise
calendar date. Chauth here does not calculate named Karwa/Sakat annual rules.
The **Up Next** list hides dates earlier than today in IST. Month view retains
all events, including past dates and their details, with earlier days visually
de-emphasized. When the selected month has no future dates, the list says so
without implying the month has no events.

`POST /api/ritual-assist/observances` validates a bounded month, selected city (or legacy offline PIN),
Amanta/Purnimanta labels and the explicit Smarta household planning policy. Node
uses the existing two-thread/six-requests-per-minute calendar budget; Workers use
the existing calendar limiter and a bounded 24-entry, one-hour in-memory public
result cache keyed by location, month, convention and policy version. No saved
death record, account, new schema, external date API or scraping is involved.
`frontend/lunar-core.mjs` shares the unchanged astronomy primitives with the
remembrance engine. `backend/observances.mjs` owns public occurrence selection.
An independent, default-off Hindu festivals checkbox covers Diwali, Holi,
Janmashtami, Ganesh Chaturthi, Ram Navami, Navratri/Dussehra, Raksha Bandhan,
Makar Sankranti (solar ingress), Chhath and Onam. Selected resolved dates are included in
the month view, share card and ICS export; unselected festivals remain excluded.

Each result records the engine/policy version and exposes local timing and its
rule. Missing/repeated sunrise tithis, skipped following-Dwadashi sunrise,
multiple moonrise candidates, close day overlaps and five-minute boundary cases
are confirmation-only and excluded from reminders. Ordinary morning Parana is
available; exceptional Parana windows are withheld. Festival rules are
city-calculated planning estimates, not a certified regional Panchang; each date
shows its rule and local-confirmation caveat. Special rules such as Bhadra for
Raksha Bandhan and Rohini-based Janmashtami selection are not calculated.
Holi, Janmashtami, Onam and Raksha Bandhan remain confirmation-only and excluded
from image/reminder exports until their missing regional/exception rules are
implemented. Generic festival periods overlapping two civil days require
confirmation too. No hardcoded annual-date overrides are used; review evidence
is in `docs/RITUAL_FESTIVAL_REVIEW_2026-11-04.md`. No
Vaishnava/ISKCON rule, independent priest certification, calendar subscription or
automatic notification delivery is claimed.

General-calendar ICS exports selected future resolved dates, with single-event
exports, optional previous-evening/day-offset alarms and separate resolved
moonrise/Parana entries. Timed reminders use 15 minutes before the event. Past
alarms are omitted; UIDs remain stable across languages and include location.
Files use individually calculated dates rather than Gregorian recurrence rules.
Import and actual alarm delivery depend on the user's calendar client and have
not been provider-verified. Input fields are remembered in this browser; results stay in transient tab memory. Calendar
imports share the selected dates and PIN-area location with that provider.

The **Share upcoming dates** card previews a Panchang-inspired bilingual image
using only selected, resolved dates from today onward. Download a PNG or use the
device share sheet when image sharing is supported; otherwise the card downloads
for attaching to a message. Its compact ivory-and-green layout includes its city,
month, a subtle mandala motif and the shared Sushant Synapse logo/name footer, plus a
reminder to confirm dates with family tradition and a regional Panchang. The
preview is collapsed by default to save screen space. The image uses a shorter
header and a single mandala accent; the duplicated date paragraph is removed.
The image is rendered locally; no dates are sent to a sharing provider until the
user chooses to share the file. The result remains transient in the tab.

Enter a past/present death date, exact IST time and select an Indian city. The Shraddha/Barsi form offers manual city search and opt-in Use my location, reusing Ritvayam's offline city directory and 75 km nearest-city limit. Detection requires browser permission and never starts automatically. Raw GPS coordinates stay in the browser; only the selected city ID goes to the server, which independently resolves its coordinates. The selected city ID, date, IST time and family settings are remembered locally in this browser. Raw GPS and unselected city search text are not persisted. Denied/unavailable/out-of-coverage detection leaves manual search available; editing or language changes invalidate late detection callbacks.

The selected city supplies both death-day and observance timings, as the existing one-location calculation policy requires; the form explains that current location must be appropriate for both. Coordinates are approximate settlement points, not an exact address. Optional family settings override regional Amanta/Purnimanta defaults, civil/sunrise day counting, confirmed death tithi and day 13. Defaults do not determine family tradition. The legacy PIN/city API inputs remain supported for compatibility, while the separate general monthly observance calendar retains its PIN interface. No external map/geocoding provider is connected.

The result includes first-year Chautha, days 10–13, Masik, first Barsi and first matching Pitru Paksha after Barsi. The yearly overview has the current year and next ten display years, retaining earlier current-year dates and multiple applicable observances. Masik/Barsi/Pitru dates use lunar tithis and local Aparahna; early mourning days use inclusive day counts. The post-first-Barsi Pitru policy is explicitly selected, not universal. Ten upcoming occurrence arrays remain internally for compatibility. Changing inputs clears results; no server death record is stored.

The result highlights the next Barsi/Samvatsari and next Pitru Paksha Shraddha separately. The year selector shows a compact, bilingual share card for one selected year at a time; it defaults to the next upcoming calculated observance. Choosing a year opens its preview and language changes retain that selection in tab memory. Download and device image-share use a year-specific PNG, with both observance columns, tithi/month, tithi interval, Aparahna candidates, confirmation status, place and a minimal Sushant Synapse logo/name footer. The complete year-by-year table is behind All years & details and remains available in Print / Save PDF; preparation-pack printing remains isolated. Image rendering is local and omits death inputs; no details leave the tab unless the user chooses to share the generated image.

Public POST /api/ritual-assist/calendar runs in bounded Node worker threads: two concurrent calculations, six requests/address/minute and 20 seconds. Inputs undergo server validation. No SQLite write or request-body logging is introduced; hosting metadata and temporary rate limits still apply. Guides/form are served independently by Cloudflare, while a new calculation requires the backend.

## Calendar reminders

Download calendar reminders creates a local .ics file containing individually calculated resolved upcoming dates through the final displayed year. No recurring Gregorian yearly rule is used. Conditional, unresolved, expired and out-of-range dates are omitted. Each event is private, all-day and transparent, with a stable hashed UID and optional display alarm at 9am IST on the day or 1/3/7 days before. Past alarm times are omitted. UTF-8 text uses RFC 5545 escaping, CRLF and 75-octet folding.

Open/import the file into a calendar app. Google Calendar imports ICS on a computer through Settings → Import & export; choose a private calendar and check notifications afterward. Imported alarms may be ignored or changed by the calendar client. Reimporting can duplicate events. This is a one-time export, not account integration, automatic sync, notification delivery or WhatsApp automation. Importing shares included observance dates with the chosen provider. No provider account was connected or actual reminder delivery tested. [Google import instructions](https://support.google.com/calendar/answer/37118) and [RFC 5545](https://datatracker.ietf.org/doc/html/rfc5545).

## Preparation pack

Open preparation pack lets families select mourning/remembrance guides and optional Havan. Defaults: Prarthana sabha, days 10/11/12 and Shraddha. Historical and uncertain calendar dates remain visible with their status, alongside sources/custom notes, material checklists and responsibility fields. Print pack / save PDF prints only the pack, including checks and responsibility names. Download preparation pack exports UTF-8 text. Empty guide selection prevents export. All checks, names and selections remain in transient tab memory, survive language changes and clear on refresh or a new calculation/input edit. Pack checks are separate from standalone guide checks. Sharing the resulting file also shares its included death/location details and responsibility names. No business-state browser persistence is added.

## Method and limits

Vendored MIT Astronomy Engine 2.1.19 computes geocentric Moon–Sun separation; each 12 degrees is a tithi. Month classification uses a Chitra/Spica-aligned sidereal Sun, not exact Lahiri/Swiss Ephemeris. Aparahna is the fourth of five equal sunrise-to-sunset parts; maximum tithi overlap selects a date. No overlap, close overlaps and five-minute boundary guards withhold dates. Adhik/Kshaya Maas, uncertain month classification, special death tithis and family exceptions require confirmation. Postal coordinates are approximate. This is not a certified regional Panchang or priest-reviewed service. Selected published 2026 fixtures agreed within 2–3 minute tolerances; this is not exhaustive future/historical certification. See [third-party notices](THIRD_PARTY.md) and the dated content/PIN reviews in docs.

## Ownership and verification

PNGs follow the active calendar view: First year & early rites exports the
combined schedule; Upcoming / by year exports the selected year in chronological
order with the next date marked. Compact rows show calculation details directly.
Width is 1080px; height follows content. First-year filenames differ from year
filenames. Ivory and Midnight are explicit
export colour choices, independent of the app theme and retained across language
changes in the current result. The card shows tithi intervals, candidate Aparahna
windows and counted-day bases directly.
Conditional/unresolved/earlier-year labels remain visible. No death identity is
added. Image generation stays local in canvas with existing branding and sharing.

`remembrance-view.mjs` presents one calculation through First year & early rites
and Upcoming / by year. The appropriate period opens automatically; accessible
tabs and one shared observance-year selector use existing results without
refetching. The next date is marked within the selected year's chronological
list, with past dates labelled. Native date/time inputs replace segmented steppers.
The completed form collapses into an editable summary. Dates lead each compact
entry; tithi intervals, candidate windows and day-count bases appear directly
in compact desktop columns/mobile rows without per-observance disclosures.
Uncertain dates remain labelled and existing calculation guards remain intact.

One Download / share disclosure contains reminders, text/PDF, preparation tools
and selected-year PNG sharing using the same year selection. Full-calendar PDF includes all periods and ten
upcoming years; pack-only printing remains separate. Language, theme, transient
checklist state, canonical API fields and server validation remain supported.

calendar-input-memory.mjs owns bounded, allowlisted browser form preferences; calculated results remain transient. guides.mjs and its mourning/material modules own preparation content; app.js owns guide UI. panchang.mjs owns the existing engine. calendar-export.mjs owns pure ICS export; observance-card.mjs and shraddha-card.mjs own local image renderers; preparation-pack.mjs owns pack selection/text; calendar-tools.mjs owns transient pack/reminder UI. Server composition stays in server/index.js; frontend files are explicitly allowlisted. No new payment, booking, provider connection, schema or recipient configuration.

Verification: `node --test tests/ritual-calendar-export.test.js tests/ritual-panchang.test.js tests/ritual-pincode.test.js tests/ritual-calendar-api.test.js tests/ritual-assist.test.js tests/ritual-observances.test.js` and `npx.cmd playwright test apps/ritual-assist/tests/browser.spec.js`. Browser tests download actual ICS/TXT/PNG/PDF, verify the selected-year image and complete eleven-year PDF, optional festival filtering and export, full-calendar print and pack-only print isolation, bilingual sharing/fallback, retained checks/assignments, stale clearing, failures/cancellation and responsive themes. All API/browser tests use isolated temporary DATA_DIR values. Live evidence is recorded separately in the functionality ledger.

Temple Seedha: the Shraddha/Barsi/Samvatsari guide includes bilingual raw-food donation materials, temple acceptance/quantity questions and packing notes via `frontend/seedha.mjs`. It appears in guide checklists and calendar preparation packs. The list is conditional and source-linked; quantities and family rites must be confirmed. No calculation or persistence change.

Sensitivity review (10 October 2026): mourning guides and preparation exports include a calm family-care note without judging grief, devotion or ritual completeness. Seedha quantities remain a family example. Calendar dates are calculated planning candidates, not a certified regional Panchang; confirm before final arrangements. No independent doctrinal or astronomical certification is claimed.

# Ritual calendar expansion proposal

Planning review: 23 October 2026 (Asia/Kolkata). The user subsequently authorised
sequential implementation and deployment after verification.

## Initial implementation checkpoint

The initial core release implements the foundation and ordinary-case policies
from stages 0–2: shared astronomy, bounded month calculations, seven event types,
PIN-based India/IST timing, explicit Smarta household planning, bilingual list/
month views, filters, next-occurrence navigation and selected/single-event ICS
reminders with optional timed moonrise/Parana entries. Existing remembrance routes
and data remain compatible, with a dedicated tab and `?view=remembrance` link.

The supported general-calendar range is 2025–2030. Requests calculate one month,
not an unbounded year. Local calculation observations were about 57–203ms in
an unloaded Node process; these are not production Worker CPU measurements.
Exceptional Ekadashi/Parana, multiple moonrise or sunrise candidates and boundary
cases remain visible for confirmation but cannot be exported as settled dates.
January 2027 skipped-Dwadashi sunrise is explicitly covered, in addition to
2026 Adhika and missing/repeated sunrise cases. No Drik runtime dependency.

Independent priest review, provider-side ICS import/alarm certification and full
regional equivalence remain unverified. The released product is a calculated
planning aid. Stage 3's additional monthly families, Sankranti and annual festival
policies are not implemented; optional stages 4–5 also remain unavailable.
The original estimates and wider candidate catalogue below remain the roadmap.

Core release `d861abf` deployed on 23 October 2026 as Worker
`156f909b-16df-433a-ab78-0aa6830485ee`. Full checks pass 371/371, Ritual Assist
browser workflows 15/15, final focused calculation/export checks 16/16, and exact
production dry-run/compiled-Worker routing checks pass. Live general calculations,
exception withholding, ICS, existing remembrance and 16 responsive bilingual/theme
layouts pass. No business-data changes; see the functionality ledger for evidence.

## Existing implementation

- `apps/ritual-assist/frontend/panchang.mjs` uses vendored MIT Astronomy Engine
  2.1.19, with geocentric Moon-Sun separation defining 30 twelve-degree tithis.
  It searches exact tithi boundaries and local sunrise/sunset. Despite its
  frontend path, calculation requests execute server-side.
- `apps/ritual-assist/backend/edge.mjs` runs the engine directly in the production
  Cloudflare Worker. Node uses bounded worker threads through `routes.js` and
  `calendar-thread.mjs`. No Drik Panchang API or live scraping is involved.
- Offline GeoNames PIN data provides approximate Indian coordinates. Current
  death and observance locations are the same; time zone is Asia/Kolkata.
- Remembrance rules use Aparahna overlap, inclusive early-day counting and
  Amanta/Purnimanta labels. Chitra/Spica month classification is not an exact
  Lahiri implementation. Adhika/Kshaya and boundary cases need special handling.
- Existing fixture tests compare selected 2026 tithi/sunrise results with
  published references within two/three minutes; broad accuracy is not certified.
- Reminders are downloaded ICS events with optional 9am IST alarms on the day
  or 1/3/7 days before. No automatic delivery, subscription or account sync exists.

## Proposed product

Keep `/ritual-assist/calendar` as the entry, with Upcoming dates, Monthly calendar
and Shraddha/Barsi destinations. General dates must not require death details.
Choose observance location, year and explicit tradition settings. Provide English
and Hindi names, event filters, a Next occurrence shortcut and date details showing
tithi start/end, relevant local timing, selected rule and confirmation status.
Retain existing remembrance inputs, exports and preparation packs.

Initial candidate catalogue (12 families; staged release, not one rule per tithi):

1. Ekadashi, initially an explicitly selected Smarta policy; add Vaishnava policies
   separately, with audited Parana windows and special Dwadashi cases.
2. Amavasya, distinguishing tithi interval from activity-specific observance date.
3. Purnima/Poonam, distinguishing fasting from puja date where applicable.
4. Sankashti Chaturthi/Chauth, selected by local moonrise; flag Angarki Tuesdays.
5. Vinayaka Chaturthi, separately from Krishna-paksha Sankashti.
6. Pradosh, using its evening window.
7. Masik Shivaratri, using its night-time rule.
8. Masik Durgashtami.
9. Kalashtami.
10. Skanda Sashti, with regional policy recorded.
11. Sankranti, after sidereal convention is explicit and validated.
12. Selected major annual festivals, each with its own reviewed rule: Diwali,
    Holi, Maha Shivaratri, Janmashtami, Ram Navami, Ganesh Chaturthi, Navratri,
    Dussehra, Raksha Bandhan, Karwa Chauth and Chhath. This is a curated target
    list, not a claim that all share one nationwide rule.

Treat Sakat Chauth and Karwa Chauth as named annual observances, not synonyms
for every Chaturthi. Satyanarayan preparation can link from Purnima without
implying that the puja is restricted to that date.

## Calculation architecture

Retain the bundled astronomy dependency. Separate astronomy primitives from
observance policies and public calendar generation; preserve compatibility for
remembrance callers. Include local moonrise, sunrise, sunset and relevant day/night
windows. Store rule IDs, engine version, policy version and timing basis with
calculated occurrences. Lunar-month and sidereal changes must be assessed before
changing existing Barsi results.

Generate bounded month/year requests. Cache public results by precise location,
year, convention, tradition and engine/rule versions; do not cache private death
inputs as public data. Benchmark the actual production Worker CPU and memory
budget before selecting on-demand versus precomputed years. No per-cell API calls.
Use stable occurrence identities and withhold unresolved dates from reminders.

Drik Panchang is a comparison reference, not a runtime dependency or a source for
bulk copying content. Validate additional independent astronomical references and
obtain review of observance rules. Do not promise exact equivalence to Drik.

## Reminder stages

1. Extend existing ICS export to selected event families or individual events;
   offer previous-evening/day offsets and separate timed Parana/moonrise entries.
   Calendar clients control actual notifications; import behavior must be tested.
2. Add an optional subscription feed with stable UIDs, revisions and a rolling
   horizon. Provider refresh timing is outside our control. Private remembrance
   feeds need separate consent, access protection and revocation.
3. Optional owned delivery: persisted subscriptions, scheduler, retry/deduplication,
   cancellation and Web Push or Android notifications. Verify closed-app delivery
   on supported devices. Email/WhatsApp need separately configured providers.

## Stages and engineering estimate

Indicative person-days for one experienced engineer working with this codebase;
include implementation/testing, exclude external review waiting and provider setup.
These are planning estimates, not fixed delivery promises.

| Stage | Deliverable | Effort |
| --- | --- | --- |
| 0 | Rules specification, reference fixtures, accuracy and Worker feasibility | 3-5 days |
| 1 | Shared primitives, bounded general calendar API, Purnima/Amavasya UI, ICS reuse | 5-8 days |
| 2 | Ekadashi and Parana, both monthly Chaturthis, moonrise, Pradosh | 7-12 days |
| 3 | Other monthly families and curated annual festivals | 8-15 days |
| 4 | Optional subscription calendar feed | 3-5 days |
| 5 | Optional persisted Web Push delivery and settings | 5-10 days |

Core first useful release: stages 0-1, roughly 8-13 working days. Requested core
including Ekadashi and Chauth: stages 0-2, roughly 15-25 days. Broader catalogue:
23-40 days before optional subscription/delivery. Replacing the astronomy library
with original numerical astronomy is a separate multi-month effort with ongoing
accuracy maintenance; it is unnecessary for runtime independence.

## Release gates

- Cross-city and multi-year fixture matrix, including nearby cities with different
  Sankashti dates, sunrise boundaries, absent/repeated sunrise tithis, midnight,
  Adhika/Kshaya month cases and Smarta/Vaishnava differences.
- Compare both astronomical intervals and chosen observance dates. Any date
  mismatch requires explanation; passing a minute tolerance alone is insufficient.
- Expert review of fasting/Parana and annual-festival policies; label unsupported
  traditions explicitly. Choose a supported year range after validation.
- Existing Barsi/Pitru/reminder regressions, isolated API validation and rate limits,
  mobile bilingual light/dark layouts, ICS imports and Worker budget checks.
- No production release until the agreed feature scope passes these gates.

## References consulted

- https://www.drikpanchang.com/vrats/ekadashidates.html
- https://www.drikpanchang.com/vrats/sankashti-chaturthi-dates.html
- https://www.drikpanchang.com/vrats/purnimasidates.html
- https://www.drikpanchang.com/vrats/amavasyadates.html
- https://www.drikpanchang.com/vrats/pradoshdates.html

Recommended approval scope: stages 0-2, India/IST, English/Hindi, explicit Smarta
Ekadashi policy first, calendar-file reminders first. More traditions, festivals
and automatic notifications remain separately staged.

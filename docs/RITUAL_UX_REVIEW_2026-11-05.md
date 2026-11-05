# Ritual Assist improvement review — 5 November 2026 IST

Scope: recommendation-only review using UI/UX Pro Max, current app-owned source,
existing verification/release evidence and fresh public Chrome inspection.
No application implementation or deployment is included.

Subsequent user-authorised work implements recommendations 1–3 locally, one at a
time. Current implementation/verification status is recorded in the functionality
ledger and app README; this review's initial observations describe the baseline.

## Evidence and current strengths

- Reviewed guide/checklist state, calendar form/controller, monthly observance
  controller, app README, learning/festival reviews and current release ledger.
- Inspected live `/ritual-assist`, `/ritual-assist/calendar` and
  `/ritual-assist/calendar?view=remembrance` in Chrome at 390x844. Browser POST
  requests were blocked; visitor counting was stubbed. Beta acknowledgement was
  accepted only in the disposable browser context for unobstructed inspection.
- No horizontal page overflow was observed on these three initial screens.
  Inspected visible main-content buttons/selects/non-checkbox inputs met 44px
  height in the final home/remembrance checks. This is not an accessibility audit.
- The home page's initial guide begins approximately 1,465 CSS pixels below the
  viewport top, after the hero and full fifteen-guide catalogue.
- Existing features include English/Hindi, theme support, custom checklist items,
  optional remembered checkmarks, quantities, arranger names, filters, local
  exports, learning notes, accessible calendar tabs and uncertainty exclusions.
  These should be retained rather than proposed as new features.
- Current release evidence already covers real PNG/ICS/PDF output and result
  layouts. Those workflows were not rerun during this initial-screen review.

Inspection images: `.publish/ritual-review-home-visible.png` and
`.publish/ritual-review-remembrance-visible.png` (visually reviewed), plus the
initial calendar capture `.publish/ritual-review-calendar-mobile.png`.

## Recommended implementation order

1. **Make the primary task immediately accessible.** Offer direct entry to
   Prepare a ceremony, Vrats & festivals and Shraddha/Barsi. Keep the selected
   guide/checklist near the top on mobile, with the catalogue behind Change ritual
   or an expandable chooser. Preserve existing direct guide/learning URLs,
   browser navigation and search. Success: a chosen checklist is visible without
   scrolling through the full catalogue at 390px; keyboard focus remains logical.

2. **Share the personalised preparation work.** The current Share guide action
   sends a guide URL; it does not include custom items, quantities, arrangers or
   completion state. Add clearly separate Share checklist and Share guide link
   actions. Reuse checklist text/print rendering, preview included personal names
   before sharing and retain native-share/copy/download fallback. Explicitly
   label shared files as snapshots. Do not imply live family collaboration.

3. **Put saved-state controls where users can find them.** Custom items,
   quantities, names and date persist locally, but Remember checkmarks is below
   the complete list. Reset checks clears only completion. Move the saved-state
   explanation/toggle near progress and add separate Clear checks and Delete this
   saved checklist actions with clear scope and recovery/confirmation. Consider
   a versioned downloadable backup/import in a later increment; never represent
   device-local state as cloud backup. Retain existing saved IDs and content.

4. **Provide an honest unknown-time journey.** Both current UI and API require
   an exact IST time, including when a confirmed tithi is supplied. Add an
   explicit I don't know the time route that offers preparation guidance and,
   where independently safe, date-counted early-rite planning. Withhold lunar
   remembrance dates until sufficient information is confirmed. A future
   confirmed-tithi route needs its own input contract and reviewed month policy;
   tithi alone must not be treated as enough. Never substitute noon or midnight.

5. **Separate death location from ceremony location.** One selected city is
   currently used for both calculations, with an honest explanatory note.
   Support distinct cities with a Same city default. Death context should drive
   the original tithi/month determination; ceremony location should drive local
   observance windows under an explicitly reviewed policy. This needs API,
   algorithm, cache/export identity and cross-city regression work, not just a
   second input field. Keep the current limitation visible until verified.

6. **Make uncertainty actionable and strengthen validation evidence.** Preserve
   all existing withheld-date/export guards. Pair confirmation-only entries with
   the particular reason and a compact question/details summary families can
   show their priest. Explain how many selected dates were excluded from an
   export and why. Prioritise reviewed Bhadra/Rohini/regional selection policies
   before releasing currently withheld festivals as resolved. Add independently
   sourced multi-year/multi-city fixtures; seek practitioner review separately
   from numerical fixture checks. More automated tests alone do not certify
   tradition or astronomical policy.

7. **Improve calculation recovery and reminder hand-off.** Current controllers
   announce busy/errors and keep inputs, but offer text-only failure guidance.
   Distinguish invalid inputs, connection failure, timeouts and rate limits;
   offer Retry and respect server cooldown without automatic request loops.
   Localise user-facing failures. After ICS export, offer concise Google/Apple/
   Outlook import guidance and explain snapshot scope, duplicate-import risk and
   provider-dependent alarms. Verify provider behaviour before claiming delivery.

## Follow-up hygiene and limits

The app README still describes the monthly form as PIN-based, while the current
form uses city search. Root README has older twelve-guide/PIN descriptions
alongside newer updates. Consolidate these during the next implementation pass.

Recommended first release: items 1–3 plus recoverable error states from item 7.
Treat items 4–6 as separate reviewed increments with isolated temporary data,
existing bilingual/theme/export regressions and appropriate calculation tests.
No booking, payment, external messaging or live family sync is proposed for this
first release. No production calculations, reminder delivery, real-device testing,
full accessibility audit or new correctness certification were performed here.

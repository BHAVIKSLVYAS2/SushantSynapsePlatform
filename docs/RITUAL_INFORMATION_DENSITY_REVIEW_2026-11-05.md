# Ritual Assist information density review — 5 November 2026 IST

Recommendation-only review of the current local implementation, including the
recent checklist and browser field-memory changes. These changes have not been
deployed. Scope is Ritual Assist; no shared-platform redesign is proposed.

Subsequent authorisation: the user approved all six increments, commit and
deployment. Implementation now passes the focused geometry checks: first Ganesh
material at approximately Y=651px in both English/Hindi at 390px, versus 1,400px
at baseline; November Vrat entries average 140px versus approximately 283px.
Current release and full verification status is recorded in the functionality
ledger. The observations below document the original baseline.

## Inspection and evidence

Used UI/UX Pro Max guidance plus direct inspection of guide data, controllers and
styles. A disposable local SQLite DATA_DIR and Chrome exercised Ganesh, Day 11,
the remembrance form/results and Vrats results at 390x844 and 1440x1000 in light
theme. Calendar calculations used synthetic 1 October 2025, 12:00 IST, New Delhi
inputs and November 2026 Vrats. The browser clock was 5 November 2026 IST. Visitor
counting was stubbed and external requests were blocked. No production data or
accounts were accessed. This is not a new date-correctness or accessibility audit.

Metrics: `.publish/ritual-density-metrics.json`. Visually inspected captures:
`.publish/ritual-density-guide-1440.png`,
`.publish/ritual-density-remembrance-form-1440.png`, and
`.publish/ritual-density-vrat-result-390.png`. Other mobile/desktop captures use the
same `ritual-density-` prefix.

| Measured state | Observation |
| --- | --- |
| Ganesh guide, 390px | First checklist item at page Y=1,400px; entire page 3,878px. |
| Ganesh guide, 1440px | First item at Y=1,385px, below the 1,000px viewport. |
| Mobile guide overhead | Calendar banner 271px, guidance notice 83px, export actions 148px, saving panel 184px. These heights exclude intervening margins, titles and checklist header. |
| Day 11, 390px | 69 material rows, mean row height 65px; entire page 8,234px. |
| Day 11, 1440px | Mean material row 61px; long checklist beside a much shorter sequence card. |
| Remembrance form, desktop | 340px-wide, 868px-tall restored-input form beside an initially empty 784px-wide results column. |
| Remembrance result, mobile | Collapsed form still 260px tall; the two selected-year event rows themselves are 139px and 119px. |
| Vrats, mobile | Nine event cards, eight 277px high and one 333px high; visible card text approximately 118–218 characters. Entire page 6,231px. |

Page heights include normal app/legal footers. They are context, not percentages
of empty pixels. Heights describe these exact states, not every language/device.

## Proposed increments, in implementation order

1. **Compact the guide opening and repeated title.** Replace the promotional
   calendar banner on the guide workspace with a small calendar entry strip.
   Keep calendar access prominent. Reduce the general scope notice to a clear
   sentence with details available. Consolidate the chosen ritual's repeated
   heading/illustration into one workspace heading with date and progress.
   Keep Change ritual accessible. This is the first implementation candidate.

2. **Use one short action toolbar.** Keep Share checklist and Preview/Print
   directly accessible. Put text download, copy and Share guide link in More.
   Merge the duplicated print routes into one preview-to-print journey without
   losing actual PDF printing, text export, native sharing or fallback controls.
   The present six-button block costs three rows on a phone.

3. **Keep saving controls small and remove repeated explanations.** Retain a
   visible Remember checkmarks toggle and brief browser-save status near progress.
   Put destructive deletion and extended explanations under Checklist settings.
   Calendar forms should give one concise explanation of browser retention and
   explicit server calculation rather than multiple separate paragraphs.
   Keep errors and uncertainty visible; never hide a failed save behind settings.
   Across increments 1–3, target the first ordinary English material row inside a
   390x844 viewport, roughly Y=600–750px, then check Hindi independently. This is
   a design target, not a verified before/after result.

4. **Render Vrats as a useful compact agenda.** Each collapsed row should show
   date/weekday, observance, calculated/confirmation status and the applicable
   admitted local milestone (such as moonrise or Parana). Group same-day events
   under one date. Keep full tithi/rule/source details expandable. Desktop can
   use an aligned agenda table; mobile can use roughly 110–150px entries where
   content permits, rather than fixed tall cards. Do not force exceptional or
   Hindi entries into a clipped height. Move repeated per-card actions into a
   compact labelled action or event-details area. Preserve all withheld-date
   export rules and explicit warning reasons.

5. **Use desktop width for the task.** Before remembrance calculation, use a
   compact full-width form: date/time beside each other and city taking the space
   it needs. Do not reserve a mostly empty results column. After calculation,
   retain a short editable input summary; storage controls should not leave a
   225–260px card above the results. Existing compact remembrance result rows are
   already substantially denser than Vrat cards and do not need another redesign.
   For long guide checklists, move the short preparation sequence out of an
   otherwise mostly empty side column and let semantic material groups use the
   desktop width. Keep mobile single-column and preserve logical reading order.

6. **Surface useful existing information and improve specific gaps.** Ganesh has
   notes for 7/11 materials; Havan 15/15; Day 11 69/69. Important short item notes
   are currently under the three-dot menu and then Item guidance. Show specific
   preparation/care/conditional-use notes in a short secondary line or an obvious
   item-details control. Place a repeated generic confirmation note once per
   applicable group, retaining item-specific exceptions. Add a compact,
   ceremony-specific preparation summary (what to arrange beforehand, what the
   officiant supplies, applicable family choices) by reorganising reviewed content.
   Expand substantive gaps only through sourced review. Do not invent quantities,
   mandatory rites, timings, repetition counts or a complete vidhi to fill space.

## Constraints and next action

Reduce repetition, padding and unnecessary containers before shrinking text or
controls. Preserve readable English/Hindi, 44px primary touch targets, native
inputs, themes, sources, sensitivity/uncertainty labels, saved customisations,
input memory, access enforcement and all existing exports. Keep duplicated safety
or family-custom advice concise while retaining the relevant warning at the point
of decision. No unmeasured percentage-reduction claim is made.

The user requested analysis followed by separate implementation decisions.
No application code was changed for this review. Start with increment 1 when
implementation is authorised, verify its actual screen geometry and then proceed
through the remaining increments individually.

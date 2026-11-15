# Chambers simplicity audit

15 November 2026. Audit and recommendations only; no app implementation.

## Scope and evidence

Reviewed app.js rendering/forms/navigation, schema.js fields, Node and edge
preparation handlers, organisation scope, client portal, existing daily-work
test and repository release records. Visually inspected overview, case detail
and Add case at 390px in an isolated, organisation-scoped Node fixture with
synthetic records. No production account, business data or database was accessed.
This is an implementation/visual audit, not an advocate usability study or a
new verification of production D1 behaviour. No claim that every workflow passed.

The existing daily-work browser regression passes (1/1): overdue outcomes,
atomic next hearing, case-section context and 12 theme/width combinations.
Visual evidence: .publish/chambers-audit-{overview,case,add-case}.png and
.publish/chambers-simplicity-audit.json. The 390px example overview content was
1,732px tall before surrounding shell/footer; case detail content was 1,985px
within an 818px modal. These are fixture-specific measurements, not production
performance benchmarks.

## Existing functionality: do not build duplicates

| Earlier suggestion | Existing implementation | Decision |
| --- | --- | --- |
| Today's desk | Overview prioritises missed hearing outcomes, upcoming hearings and overdue tasks; reminder dialog also exists | Improve current overview, no second dashboard |
| Case checklists | Prepare hearing generates three case-linked tasks using General/Civil/Criminal templates; due dates and assignees are supported | Keep and improve discoverability only if necessary |
| Document readiness | Case-linked files and tasks exist; required-document register does not | Represent a missing document as an assigned task initially; no parallel tracker |
| Fee follow-ups | Outstanding balances, overdue invoice filter, client balances and printable statements/receipts exist | Keep current billing; no extra dashboard or ageing report yet |
| Case timeline | Hearing history, tasks, notes, files, fees and expenses exist as case sections | Simplify access to these; defer another aggregate timeline |
| Client updates | Notes/calls and restricted read-only client portal exist; hearing-summary WhatsApp draft action was not found in reviewed Chambers renderer | Optional later, reviewed copy/share action only; no automatic delivery claim |

## Recommended sequence

1. **Simplify Add case.** Schema has 17 fields but only matter title, client and
   court are required. Keep these plus optional case number and practice area
   in the first group. Put remaining optional fields in More details. Retain
   all stored fields, editing and validation. Judge, courtroom and opposing
   counsel should not obstruct creating a basic matter.
2. **Simplify case detail.** Current view presents 12 facts and repeated empty
   values, then six jump links and every section including empty ones. Start
   with client, court, stage, next hearing and responsible advocate. Put other
   facts in More details; retain edit access. Show one working section at a
   time with counts (Hearings, Tasks, Documents, Notes, Fees), with expenses
   reachable within Fees. Preserve case context and accessible navigation.
   Do not hide useful information merely because a field is empty: important
   missing next date/assignment must remain obvious.
3. **Trim Overview.** Retain missed outcomes, today's/upcoming appearances and
   due/overdue work as the primary content. Reduce the prominence of totals;
   remove the generic five-case list and promotional banner from the daily
   overview. Casebook remains available. Keep financial totals subordinate
   rather than adding more KPI cards or charts.

## Defer

No separate document checklist module, new timeline page, second dashboard,
more report charts, automated reminders, AI legal advice, court synchronisation
or payment gateway as part of this improvement. Existing in-app reminders,
manual court dates and official eCourts link must not imply external delivery
or sync. A reviewed hearing-update draft can be considered after these three
changes and advocate feedback; it is optional, not a launch requirement.

The UI/UX skill search for progressive disclosure returned an unrelated heading
rule; the narrower form query returned applicable labels/required indicators
and submission feedback guidance. Existing forms already provide these. The
recommendation to group optional fields is based on inspected source/screens,
not attributed to that unrelated search result.

No implementation, commit or deployment performed for this audit.

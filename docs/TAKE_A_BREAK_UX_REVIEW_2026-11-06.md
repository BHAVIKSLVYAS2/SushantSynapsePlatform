# Take a Break UX review — 2026-11-06

Follow-up: the user authorised the first five items after correcting Ritual
Assist's calendar priority. Those items are now implemented locally; verification
and deployment status are recorded at the top of `FUNCTIONALITY_LEDGER.md`.
Item 6 remains deferred. The analysis below records the original baseline.

Analysis only; no application changes or deployment. Reviewed current app HTML,
CSS, controllers, README and existing browser workflows. Inspected local Chrome
at 390×900 and 1440×900 using an isolated temporary SQLite DATA_DIR and an
acknowledged beta notice. Screenshots are ignored `.publish/break-review-*.png`
artifacts. Production was not inspected in this pass.

## Recommended implementation order

1. **Protect unfinished rounds.** Clicking the already-selected Daily challenge
   resets the controller. Browser reproduction: submit one Code guess; click
   Daily challenge; history drops from one check to zero without warning.
   Make selecting the current mode harmless; provide an explicit restart action
   and a discard prompt when replacing unfinished work. Preserve existing
   in-tab navigation state and the Chaos pause behaviour.
2. **Simplify discovery.** Seven filters serve only seven activities. Puzzle and
   Logic contain the same three activities; Memory contains one. On mobile the
   filter strip has 618px content inside 266px, so several choices are hidden.
   Prefer All, Puzzles, Quick play and Choose, with clear overlapping tags where
   useful. Derive the activity count: initial text currently says eight for seven
   cards and only corrects itself after a filter interaction.
3. **Show useful information in less space.** Cards hide their existing small
   print, including untimed play, hints and level details. At 390px cards are
   136–139px high; the first begins at Y=363 and Decision Wheel at Y=1266.
   Use smaller decorative artwork, tighter spacing and a visible metadata row.
   Put timing/difficulty guidance near the top. Preserve readable text, focus
   indicators and 44px targets; board spacing should remain comfortable.
4. **Unify Make 24 and Daily Spark naming.** The bottom Daily Spark button opens
   the same activity as Make 24, but looks like another game. Use Make 24
   consistently with Daily Spark as a subtitle, and expose difficulty from that
   single entry. Existing shared URLs must keep working.
5. **Make repeat visits useful.** Refresh currently discards every game state,
   as the footer honestly says. Offer browser-local resume for puzzles, an
   explicit fresh start and a clear saved-on-this-device explanation. Daily
   state must be keyed by IST date and puzzle version. Face-Off custom lists
   should remain tab-only unless the user opts to save them. This is a proposed
   behaviour change, not a defect in the documented current contract.
6. **Explain the solution after revealing it.** Code has a worked generic clue
   example and a starting hint already. Its reveal shows the answer and asks
   users to compare it themselves. Add a concise explanation against the actual
   five clues and an optional deduction walkthrough. Retain honest hint/reveal
   reporting and avoid spoilers in shared results.

## Existing strengths and limits

No horizontal page overflow in either measured viewport. Existing code already
supports keyboard Lights Out controls, undo and hints, Chaos pause/calmer pace,
in-tab return-state restoration, native/copy/manual sharing and reduced-motion
rules. These are not missing-feature recommendations. This was a targeted
source and browser review, not a full regression, dark-mode contrast audit or
screen-reader certification. UI skill navigation searches returned unrelated
matches; discovery recommendations above are based on measured app behaviour
and general review judgment, not those search results.

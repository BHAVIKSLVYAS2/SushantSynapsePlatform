# Gujarati coverage review — 7 November 2026

Discussion-only source and live signed-out review. No translation/runtime changes,
build, commit or deployment. Inspected 17 public routes/states in disposable mobile
Chrome with Gujarati selected. Initial Ritual Prep scan occurred during loading;
a separate scan waited for its guide title and confirmed the gaps below. No
private records or authenticated workflows inspected. This is a candidate inventory,
not a complete translation percentage or proof all states of an app were covered.

## Confirmed examples

| Area | English still present with Gujarati selected |
| --- | --- |
| Home/discovery | Filters, app count, several newer descriptions |
| Take a Break / Make 24 | New game, Options, Difficulty, selected Challenge option, Restart this puzzle, Combine numbers, Hint, instructions |
| Other break games | Code clues/instructions, dynamic check/move/level counts, Chaos instructions and status labels |
| Picksy | Edit choices, Reuse choices, Tick sound: off, Vibration: off, 6 EQUAL CHOICES, privacy/help copy |
| Bill Splitter | What was it for?, Amount (₹), Shared by everyone, Person 1/2, introductory and privacy copy |
| Photo Resize | Choose photo or signature, Prepare for, Document type, Maximum file size (KB), validation/help copy |
| Ritual Prep, settled | Change, Share image, Save PDF, 0 of 7 items arranged, Remember checkmarks, Checklist settings |
| Moment Studio | Export/privacy guidance, design descriptions, some design names (names require classification) |
| News | Date/empty-state/generation instructions; author and publication names are intentional content |
| Timetable | Setup help, counters and storage/backup guidance; broad gaps |
| Fund Lens | Choose your funds, Nationwide search, Clear selected funds, comparison/data-coverage guidance; fund names remain original |

QR Maker's initial scan found mostly app names among residual English. Matching's
initial form showed no pure-English candidate text under the scan rules; calculation
results, technical disclosures and exported documents were not comprehensively
exercised. Neither observation establishes complete translation.

## Causes in source

1. `packages/ui/interface-copy.mjs` contains 986 entries. All have nonempty Gujarati
   values and none equal their English keys. Missing *source phrases* are the main
   issue, not empty Gujarati cells. Recent UI changes introduced uncatalogued copy,
   including New game, Options and Edit choices. Some of this omission was in the
   recent assistant-authored UI changes.
2. `packages/ui/language-runtime.js` uses exact normalized text matching and falls
   back to the source for unknown keys. Reworded text and punctuation changes can
   bypass earlier translations. Variable strings such as move counts, selected
   dates and Person 1/2 cannot be comprehensively fixed with one static entry.
3. Dropdown option translation is restricted to named selects or
   `[data-interface-options]`. Make 24's `#practice-difficulty` is not opted in.
   Challenge already has Gujarati catalogue text, but its option remains English.
   Warm-up and Expert also lack entries. Both catalogue and dropdown ownership
   need correction; preserve stored option values and engine identifiers.
4. Protected user-content/record/artwork regions intentionally bypass generic
   translation. Vedic pages delegate main-content language to their app adapter.
   Shared dictionary edits alone cannot fix every native/export/protected screen.
5. Existing language tests primarily verify menu availability, retained preference,
   navigation/header text and preservation of entered content. They do not establish
   complete Gujarati coverage of game results, errors, menus or long guidance.

## Proposed fix sequence for discussion

1. Finish shared navigation/common controls and the recently changed public tools:
   Take a Break (all games), Picksy, Bill Splitter and Photo Resize. Add missing
   authored Gujarati and matching Hindi entries, using consistent vocabulary.
2. Introduce explicit localized templates for variable UI messages/counts, with
   parameters kept separate from user names and text. Use the existing shared
   service, plus app-owned copy where appropriate; no new translation service or
   platform-wide framework rewrite is needed.
3. Opt in only UI dropdowns; keep internal values unchanged. Audit placeholders,
   tooltips, accessible names, dialogs and invalid/empty/loading/result states.
4. Complete Ritual Prep, Moment Studio, Timetable and Fund Lens; review native
   astrology technical copy and generated exports separately for terminology,
   Gujarati fonts/layout and intentional source-language references.
5. Verify en → gu → hi → en, reload and navigation, all three themes, 320/390px
   layouts and existing calculations/game progress. Assert actual Gujarati controls,
   options and parameterized results rather than relying on html[lang=gu]. Add
   checks that deliberate user input/records and internal option values never change.
6. Make locale entries and relevant state assertions part of each future UI change,
   so adding English copy cannot silently leave the Gujarati interface incomplete.

Proposed vocabulary examples: New game → નવી રમત; Options → વિકલ્પો;
Difficulty → મુશ્કેલીનું સ્તર; Restart this puzzle → આ કોયડો ફરી શરૂ કરો;
Edit choices → વિકલ્પો બદલો; Share image → ચિત્ર શેર કરો; Save PDF → PDF સાચવો.
These are proposed UI wording for the implementation pass, not a claim of independent
native-speaker editorial review.

Keep app/brand names, entered names, wheel choices, typed tasks, financial scheme
names, news/source articles and private record values in their original language.
Authored interface text around them should translate. Candidate counts include
intentional English and cannot be reported as confirmed missing translations.

Evidence: `.publish/gujarati-coverage-review.json`,
`.publish/gujarati-coverage-review.log`, `.publish/gujarati-guides-review.json`;
visually reviewed `.publish/gujarati-24.png` with Gujarati header and English game
controls. Private/sign-in workflows and exhaustive generated-result/export checks
remain outside this initial public review.

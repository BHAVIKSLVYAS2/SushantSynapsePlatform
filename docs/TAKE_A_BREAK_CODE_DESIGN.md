# Crack the Code: clue-led redesign

The first implementation used five digits, repeats and eight attempts: 100,000
possible strings with no initial information. The user found it too complex and
too dependent on guessing. The replacement keeps deduction and removes the empty
starting point.

## Research and design

- [Mastermind instructions](https://www.buffalolib.org/sites/default/files/gaming-unplugged/inst/Mastermind%20Instructions.pdf)
  explain aggregate right-position/wrong-position feedback. They explicitly note
  that peg placement does not identify which digits match and that repeats can
  confuse players. The redesign uses plain count labels, a worked example and no
  repeated digits.
- [Usborne Bulls and Cows activity](https://usborne.com/media/usborne/activity_sheet/file/b/u/bull_and_cows_game_activity_sheet.pdf)
  presents a three-digit version with different digits. This supports reducing
  rule complexity while retaining positional deduction. The game uses an original
  clue construction rather than copying a published puzzle.

The new format has three distinct digits, including possible leading zero, and
five visible clues. Each row states exact counts; remaining digits in that row
are absent. Five clues identify one code among the 720 legal combinations. Each
clue is necessary: omitting any one leaves multiple solutions. This verifies
fairness, not a measured human difficulty rating.

The original construction is permuted by digit labels, positions and clue order
using a deterministic seed. Different boards share an inference structure;
practice is not an unbounded library of independently authored puzzle types.
No runtime search, model call or remote puzzle service is needed.

Manual digit notes, one starting hint pointing to the exclusion clue, unlimited
checks, duplicate-check prevention and explicit conflicts support learning.
Reveal requires confirmation and records a reveal rather than a win. Results
record hint use and exclude solution/guesses from sharing.

Daily links carry `cv=2`; other games retain their version-1 seeds. Existing
unversioned code links open the current format. Progress stays in the tab.
No authentication, persistence, API or payment behavior changes.

## Verification

Node tests exhaust all 720 candidates on 100 seeded boards to verify the unique
answer, every clue's exact feedback, determinism and necessity of all five clues.
Browser checks cover invalid/duplicate guesses, clue conflicts, notes, help,
win/reveal, spoiler-free sharing, daily/practice reset and responsive themes.

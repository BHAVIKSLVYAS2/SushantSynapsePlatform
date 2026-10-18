# Take a Break

Lights Out replaces Clue Club: tapping a tile flips itself and its
orthogonal neighbours. Clear solvable 3×3, 4×4 and 5×5 boards with a move counter,
optimal move target, undo, restart and optional shortest-solution hints. Keyboard
arrows move focus; Space/Enter flips tiles. Lit/unlit symbols and labels accompany
colour. Daily/practice modes retain tab-only progress, and sharing records hint
use. Old `?game=clue` links open the replacement with an explanation. This change
was deployed and live-verified on 2026-10-16 from `45bc638`, Worker
`a30b46e9-abba-4336-a112-f3ab1bbfa819`; Crack the Code is unchanged.

Crack the Code is now a clue-led three-digit puzzle: five visible clues identify
exactly one code with no repeated digits. All five clues are necessary. A worked
example, manual scratchpad, starting hint and clue-conflict feedback support
deduction without a timer or guess limit. Reveals and hints are reported honestly.
Deployed and live-verified on 2026-10-16 from `e09a61c`, Worker
`a06096c8-7283-4a47-84b8-5d66fd6d8fc8`; it replaces the earlier five-digit game.
See [research, puzzle construction and limits](../../docs/TAKE_A_BREAK_CODE_DESIGN.md).

The refreshed hub features Daily Spark once above compact activity tiles, with Challenge, Choose and Unwind filters instead of an all-activities default. All seven existing activities remain available. Returning from a game restores its category and keyboard focus; in-tab game progress is preserved. Daily Spark uses the same difficulty/hint controller as its standalone page. Layouts use existing light/dark tokens and support small phones.

Refresh deployed and HTTPS-verified on 2026-10-09 in Cloudflare version `8080893b-f034-4dd0-af1f-004ffb326efb`. Combined targeted checks passed (21 Node tests, 10 Chrome workflows); live categories, featured game and Expert challenge reload also verified.

One public, laptop-independent hub at `/take-a-break` for seven activities. Make 24 reuses Daily Spark; four native games offer code deduction, memory pairs, Lights Out and preference brackets. Decision Wheel keeps its own page and return to the hub.

Daily challenges use validated IST dates and deterministic boards. Code puzzles add `cv=2` to shared links; other games keep version 1. Practice rounds use fresh seeds; progress and custom choices remain in the current tab and reset on reload. Sharing is explicit and includes a dated daily link; Face-Off shares only title/winner, never its full list. No sign-in, timer, persistent game records or app provider requests. The shared header can read existing auth status.

Run `node --test tests/take-a-break.test.js` and `npx playwright test apps/take-a-break/tests` from the repository root. Browser tests use isolated temporary data. The catalogue retains the daily-spark ID for preference compatibility; no database migration is required.

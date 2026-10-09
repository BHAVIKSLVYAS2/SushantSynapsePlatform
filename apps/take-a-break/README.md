# Take a Break

One public, laptop-independent hub at `/take-a-break` for seven activities. Make 24 reuses Daily Spark; four native games offer visual differences, memory pairs, English/Hindi clues and preference brackets. Decision Wheel and Pocket Pause keep their own pages and return to the hub.

Daily challenges use validated IST dates and version 1 deterministic boards. Practice rounds are fresh; progress and custom choices remain in the current tab and reset on reload. Sharing is explicit and includes a dated daily link; Face-Off shares only title/winner, never its full list. No sign-in, timer, persistent game records or provider requests.

Run `node --test tests/take-a-break.test.js` and `npx playwright test apps/take-a-break/tests` from the repository root. Browser tests use isolated temporary data. The catalogue retains the daily-spark ID for preference compatibility; no database migration is required.

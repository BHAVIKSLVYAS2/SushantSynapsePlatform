# Take a Break

Crack the Code replaces Oddly Different: deduce a five-digit combination in eight
attempts using exact-position and elsewhere counts. Digits may repeat and leading
zeros count. Daily codes are deterministic for the IST date; practice starts a
fresh random seed. Guesses stay in the tab, and explicit result sharing excludes
the secret and guess history. Deployed and live-verified on 2026-10-16, source
`de84eea`, Worker `13768c7e-7867-46ba-9f74-9d74292ab4f0`; see the ledger.

The refreshed hub features Daily Spark once above compact activity tiles, with Challenge, Choose and Unwind filters instead of an all-activities default. All seven existing activities remain available. Returning from a game restores its category and keyboard focus; in-tab game progress is preserved. Daily Spark uses the same difficulty/hint controller as its standalone page. Layouts use existing light/dark tokens and support small phones.

Refresh deployed and HTTPS-verified on 2026-10-09 in Cloudflare version `8080893b-f034-4dd0-af1f-004ffb326efb`. Combined targeted checks passed (21 Node tests, 10 Chrome workflows); live categories, featured game and Expert challenge reload also verified.

One public, laptop-independent hub at `/take-a-break` for seven activities. Make 24 reuses Daily Spark; four native games offer code deduction, memory pairs, English/Hindi clues and preference brackets. Decision Wheel and Pocket Pause keep their own pages and return to the hub.

Daily challenges use validated IST dates and version 1 deterministic boards. Practice rounds are fresh; progress and custom choices remain in the current tab and reset on reload. Sharing is explicit and includes a dated daily link; Face-Off shares only title/winner, never its full list. No sign-in, timer, persistent game records or provider requests.

Run `node --test tests/take-a-break.test.js` and `npx playwright test apps/take-a-break/tests` from the repository root. Browser tests use isolated temporary data. The catalogue retains the daily-spark ID for preference compatibility; no database migration is required.

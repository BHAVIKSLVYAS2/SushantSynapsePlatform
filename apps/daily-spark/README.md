# Daily Spark

The refreshed UI shares one markup/controller between the standalone page and Take a Break. New daily and practice puzzles offer Warm-up (no division needed), Challenge (division required, integer steps possible) and Expert (a fractional step required). Version-2 curated banks are verified against those properties. The Expert bank currently contains seven distinct number combinations; shuffled tile order is not a new mathematical puzzle. Daily links include `level`; original dated links without it retain the unchanged version-1 puzzle. Challenge is the default for new visitors.

Refresh deployed and HTTPS-verified on 2026-10-09 in Cloudflare version `8080893b-f034-4dd0-af1f-004ffb326efb`. Combined checks: 21 targeted Node tests and 10 Chrome workflows passed; live asset hashes, difficulty links and mobile interactions verified. See the platform ledger for full evidence.

Hints progress from an operation nudge to a first move and its result, including fraction/negative intermediate values. Instructions, reveal/reset and move history live in expandable sections; undo and hint stay visible. Revealing never counts as solving. Solves show a short reduced-motion-aware celebration, another-puzzle action and explicit sharing. Progress remains in tab memory; no scores, accounts, backend writes or tracking added.

A small free engagement app at `/daily-spark`: use four numbers once to make 24 with addition, subtraction, multiplication and division. Every daily puzzle has a solution. The v1 seed uses the date in Asia/Kolkata; visitors get the same puzzle without an API or scheduler. The daily button opens today's puzzle; a valid past `?day=YYYY-MM-DD` link reopens that day's puzzle. Practice uses device randomness.

Undo, reset, hints, reveal and explicit Web Share/clipboard/manual-copy fallbacks are included. Hints mark results as assisted; revealed answers never count as solves. Sharing omits the solution. Progress stays in tab memory. There are no persisted scores, accounts, rankings, prizes, analytics or backend writes. Device clocks determine the date. Fractions are rounded for display, retained for calculation. No new paid service or runtime dependency is introduced. Existing Cloudflare Worker request quotas still apply; this is not a claim of unlimited hosting.

Why this app: the catalogue is mostly task-driven. A fresh short daily challenge offers a repeat-visit reason, result sharing offers discovery, and links to Certificates/News offer onward exploration. Engagement improvement is unmeasured. After deployment, review aggregate visits, repeat visits and onward clicks using existing hosting analytics if available; no tracking integration was added.

Configured for laptop-independent Cloudflare serving with internet access. No service worker/offline installation is included. Deployed and verified on 2026-10-09 at https://apps.sushantsynapse.com/daily-spark; see the platform functionality ledger for version and evidence.

Verification: `node --test tests/daily-spark.test.js`; `npx.cmd playwright test apps/daily-spark/tests`; Cloudflare outage routing is covered by `tests/cloudflare.test.js`. Tests use isolated temporary DATA_DIR values and do not touch live records.

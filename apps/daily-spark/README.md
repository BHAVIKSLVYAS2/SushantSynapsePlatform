# Daily Spark

A small free engagement app at `/daily-spark`: use four numbers once to make 24 with addition, subtraction, multiplication and division. Every daily puzzle has a solution. The v1 seed uses the date in Asia/Kolkata; visitors get the same puzzle without an API or scheduler. The daily button opens today's puzzle; a valid past `?day=YYYY-MM-DD` link reopens that day's puzzle. Practice uses device randomness.

Undo, reset, hints, reveal and explicit Web Share/clipboard/manual-copy fallbacks are included. Hints mark results as assisted; revealed answers never count as solves. Sharing omits the solution. Progress stays in tab memory. There are no persisted scores, accounts, rankings, prizes, analytics or backend writes. Device clocks determine the date. Fractions are rounded for display, retained for calculation. No new paid service or runtime dependency is introduced. Existing Cloudflare Worker request quotas still apply; this is not a claim of unlimited hosting.

Why this app: the catalogue is mostly task-driven. A fresh short daily challenge offers a repeat-visit reason, result sharing offers discovery, and links to Certificates/News offer onward exploration. Engagement improvement is unmeasured. After deployment, review aggregate visits, repeat visits and onward clicks using existing hosting analytics if available; no tracking integration was added.

Configured for laptop-independent Cloudflare serving with internet access. No service worker/offline installation is included. This local release requires deployment before it is publicly available.

Verification: `node --test tests/daily-spark.test.js`; `npx.cmd playwright test apps/daily-spark/tests`; Cloudflare outage routing is covered by `tests/cloudflare.test.js`. Tests use isolated temporary DATA_DIR values and do not touch live records.

# Tournament Lite

Free for now, with no sign-in, organisation or licence requirement. Open
`/tournament-lite` directly. Six sports, 2–64 participants, fixture formats,
scoring, scheduling, corrections and winner PNGs use the existing rules.

Records save in this browser profile only. Clearing site data removes them;
there is no cloud sync or live sharing. Download backup exports a JSON copy
(automatic import is not implemented); Print results prints the selected tab.
All old server API routes return 410 and old viewer links no longer load events.
Unified login/data saving will be designed separately across the apps.

See [free-mode architecture and retirement](../../docs/TOURNAMENT_FREE_MODE.md).
Old backend adapters/schema remain unmounted for recovery compatibility.

Run `node apps/tournament-lite/build.cjs` to refresh the browser rules bundle.
Run `node --test tests/tournament.test.js tests/tournament-free.test.js` and
`npm.cmd run test:e2e -- apps/tournament-lite/tests/browser.spec.js` for isolated
rule and browser coverage. Do not use real databases for tests.

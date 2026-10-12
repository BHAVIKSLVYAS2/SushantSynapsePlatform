# Focus

Public `/focus` combines an adjustable focus timer and a personal daily priority board. No sign-in is needed. Tasks stay in this browser profile; there are no task API calls or cross-device sync.

The timer/card release is deployed at https://apps.sushantsynapse.com/focus and live-verified on 12 October 2026. Exact assets, browser-local workflows and responsive/theme checks are recorded in the platform functionality ledger.

## Focus timer

Choose 15, 25 or 50 minutes, or a custom whole number from 5 to 120. The default is 25. The selected duration is remembered separately under `synapse-focus-duration-v1`; an invalid or unavailable preference falls back safely, and failed writes leave the timer usable for this visit. Pause/resume uses elapsed wall-clock time, including when a background tab returns. Duration controls stay locked through running and paused sessions until Reset or completion. Reset uses the selected duration. Refresh starts a fresh timer with the saved duration; running session state is not persisted.

## Task cards

High, Normal and Low lanes show unfinished tasks, counts and estimated minutes. Drag a card's grip between lanes to change priority, or before another card to change order. Pointer dragging works with mouse and touch; Escape, pointer cancellation and dropping outside the board leave the task in place. Priority selectors and Up / Down buttons provide touch and keyboard alternatives. Completed tasks appear separately and can be reopened.

The task editor changes title, priority, estimate and date without replacing the task's identity or history. Unfinished earlier tasks can be brought to the selected day. India dates default to today. The summary and progress reflect saved task completion, not measured focus time.

Tasks persist in localStorage under the existing `synapse-focus-plan-v1` key. Reordering stores optional per-lane positions; older saved tasks without positions continue to load in creation order. Changes refresh other tabs in the same browser profile. Limits remain 100 tasks/day, 500/browser, 160 characters/task and estimated minutes from 5 to 240. Invalid storage and failed writes preserve existing saved tasks and show an error. Clearing browser data removes tasks and preferences.

Light/dark/system themes, responsive layouts, 44px control targets and reduced motion use the platform's shared tokens. Previously saved account plans remain preserved behind the legacy authenticated API; this public UI does not read, migrate or write them. The legacy model accepts the validated ordering/edit commands without changing ownership or revision checks.

## Verification

`npm.cmd run test:e2e -- apps/focus/tests/browser.spec.js` runs isolated Chrome workflows. `node --test tests/focus.test.js` covers legacy compatibility, ordering, edits, stale/invalid commands and capacity rollback. `npm.cmd test` and `npm.cmd run test:cloudflare` verify broader compatibility and the retained authenticated edge API. Current run and deployment status are recorded in `docs/FUNCTIONALITY_LEDGER.md`.

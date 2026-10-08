# Decision Wheel

A public free tool at `/decision-wheel`: enter 2–30 unique choices, an optional title, and spin. Starter lists cover lunch, household tasks and team selection. Each label allows up to 60 Unicode characters. Duplicate labels are rejected after case folding and Unicode normalization so each option has one equal slice.

The app uses browser cryptographic randomness with rejection sampling to avoid modulo bias. The SVG animation lands on the selected slice. Input, presets and repeated spins are locked while spinning; reduced-motion users receive the result immediately. Long labels are shortened on the wheel; full labels remain in the editor and result. Remove a winner to pick without repeats; when only one option remains, it is shown directly rather than drawn randomly.

The last 20 picks remain in tab memory and can be cleared. Refresh clears custom lists and history. There is no API, database, cloud sync, saved list, tracking or runtime dependency. Only shared theme preferences persist. Explicit sharing sends the chosen title/result and public app link through the device share menu, clipboard or manual-copy fallback; it does not include the full options list. Share menus depend on browser support and require user action.

Both public page routes are configured for existing Cloudflare frontend hosting without origin health checks. Opening the hosted page requires internet; once loaded, spinning makes no network calls. No offline install is added. This new app is locally implemented; deployment is pending.

Run `node --test tests/decision-wheel.test.js` and `npx.cmd playwright test apps/decision-wheel/tests`. Browser checks use an isolated temporary DATA_DIR. No live records are changed.

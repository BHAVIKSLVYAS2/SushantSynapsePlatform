# App sign-in and data audit

Audit date: 15 November 2026. Status: source audit and recommendations only; no authentication, storage, production configuration or user data changed.

## Agreed launch model

Personal records belong to an account and are saved on our service. Clearing browser storage or changing browsers must not delete those records: the user signs in again to retrieve them. Google sign-in is the proposed entry method. Apps will be online-only; offline editing and later synchronization are outside scope. The user waived migration of unlaunched personal browser records. Existing production business records, accounts, grants and organisation licences must remain intact.

Free versus paid is a pricing decision, independent of whether an app needs an account. A free app can require sign-in to save records. A public calculator does not need an account just because the website is online-only.

## Complete catalogue: 20 active apps

The registry currently marks 15 apps public and 5 restricted. Public today does not mean data is currently saved on our service.

| App | Current durable storage / access | Recommended launch sign-in boundary |
| --- | --- | --- |
| Hisabio | Browser IndexedDB household ledger, bills, payments and care records; offline service worker | Require sign-in for the personal ledger. Store records on our service. |
| Kiraya Saathi | Browser IndexedDB properties, tenants, rent, deposits and payments | Require sign-in for the rental workspace. Store records on our service. |
| JapSeva | Browser IndexedDB clients, sankalps, targets, counts, history and audio-play counts | Require sign-in for saved practice/client work and certificates derived from it. Keep Mantra Library, meanings, pronunciation and listening public. |
| Focus | Browser localStorage task plans; timer duration preference | Require sign-in for saved tasks/plans. Keep a standalone timer public. |
| Timetable Lite | Browser localStorage saved setup and generated timetable | Require sign-in for a saved timetable workspace. A clearly labelled temporary preview can stay public. This does not decide paid status. |
| Ritvayam | Browser localStorage named birth profiles; chart results are recomputed | Keep calculations, readings and one-off exports public. Require sign-in when saving or opening personal birth profiles. Do not silently retain every calculation. |
| Ritual Assist | Browser localStorage remembered/custom checklists, ceremony inputs and reading position; temporary tab drafts | Keep guides, calculations and temporary checklists public. Require sign-in for remembered ceremony details and reusable custom checklists. Reading position can remain a disposable preference or join account settings. |
| Moment Studio | Browser localStorage explicitly saved organisation branding/logos; recipient/signature inputs are temporary | Keep creating and downloading cards/certificates public. Require sign-in for saved branding. Do not automatically upload photos, recipients or signatures. |
| QR Maker | No app record persistence; browser-generated QR downloads | No sign-in needed. |
| Photo Resize | Local image processing, no source image upload or persistence | No sign-in needed. |
| Bill Splitter | Current-tab calculation and settlement output; no saved ledger | No sign-in needed. A future saved group/history feature would require an account. |
| Picksy | Current-tab options/results/history and sharing; no durable personal workspace found | No sign-in needed. A future saved list feature would require an account. |
| Team Mixer | Current-tab participants/results/undo and exports | No sign-in needed. A future saved roster feature would require an account. |
| Take a Break | In-memory game controllers; browser preferences such as difficulty/calm mode | No sign-in needed for play. Cross-device progress/statistics would be a separate optional account feature. Current game switching is not evidence of cloud resume. |
| Satire Arena | Votes stored in D1, owned through a signed browser cookie rather than an account | Keep browsing/scores public. Recommend sign-in for voting if users must recover/change their own votes across browsers. Existing anonymous ballots do not meet that guarantee. |
| Chambers | Existing authenticated, authorised business records; SQLite in Node, organisation-scoped D1 on Workers | Keep mandatory sign-in and role/app/organisation enforcement. Client portal access remains restricted. |
| BatchFee Lite | Existing authenticated business workspace and server persistence | Keep mandatory sign-in, app access, licence and staff roles. |
| DIGITAL SAMAJ | Existing authenticated organisation records and app-specific grants | Keep mandatory sign-in and organisation/member visibility controls. |
| Tournament Lite | Existing authenticated organiser workspace and server persistence | Require sign-in to organise/manage. Published result links remain public, limited to permitted fields. |
| Pandit Booking | Existing authenticated role-based booking workspace; optional public provider directory | Keep sign-in for bookings and management. Approved public provider browsing can remain public. Google registration must not grant provider/staff access. |

This is five core personal record apps/modes, three additional saved-feature conversions, six guest utilities, one public voting identity decision, and five existing restricted business apps. It does not mean every screen in the eight personal apps should be blocked by login.

## Other routes and shared surfaces

- Platform home/catalogue, help, contact, legal pages and product demonstrations can remain public. Existing signed-in favourites/recent preferences already use server persistence; guest theme/language settings may stay local.
- Admin and Super Admin require existing privileged access. A new personal account must never inherit a business or administrative role.
- Feedback is a public server-backed board, not a private personal record app. Its random browser cookie has the same recovery limitation as Satire Arena: content persists, but clearing cookies changes contribution/vote identity. Guest feedback is acceptable if this limitation remains explicit. Account-linked contributions are needed if cross-browser ownership is promised.
- Support/contact/WhatsApp forms prepare messages; opening WhatsApp does not prove delivery or create a recoverable platform record. Keep these public.
- The Android wrapper is a delivery surface, not a separate data-owning app. Its local WebView storage is also lost on clearing app data/uninstalling. Account-owned server records solve recovery after signing in again.
- `certificates` and `celebration-studio` are Moment Studio registry aliases/legacy implementation directories; `daily-spark` is the Take a Break registry ID and contains reused game modules. They are not three additional products. Admin, portal, feedback and Android wrapper are auxiliary surfaces. Retired News/Fund Lens are excluded from the active catalogue.

## Required work before making the recovery promise

1. **Personal account foundation:** Google identity verified by the backend, safe session creation, logout, account recovery/linking and a personal account type that grants no business role. Existing password/session and Cloudflare Access support are not already a Google self-service sign-in implementation.
2. **Personal server storage:** validated, authenticated APIs for the eight saved-feature apps, with account ownership checked on every read/write/export/import. Keep organisation business ownership separate. Preserve revision/conflict checks; JapSeva count mutations need atomic/idempotent handling so retries cannot duplicate counts. A UI must distinguish pending writes, confirmed saves and failures.
3. **Online-only behaviour:** remove or retire Hisabio's offline service-worker behaviour and update existing installed clients safely. Do not leave browser storage as the authoritative record store. When a connection/session fails, stop record writes and show a clear retry/sign-in state. Do not claim a save succeeded before the server confirms it. No offline write queue is required.
4. **Google setup and Android:** configure production OAuth origins/redirects and appropriate policy/CSP settings. The wrapper currently embeds the site in a WebView; Google prohibits OAuth authorization in developer-controlled embedded user agents. Design and verify a supported system-browser/native sign-in handoff with a secure return session. A website button alone does not complete Android support. See [Google OAuth policies](https://developers.google.com/identity/protocols/oauth2/policies).
5. **Operational recovery:** define server backups, retention, tested restore, account deletion/export and how users find their existing account. Server storage survives browser clearing but is not by itself a tested backup/recovery system. Downloaded exports remain separate user-owned files.
6. **Launch copy and navigation:** replace claims such as browser-only/no login/offline in affected app descriptions, onboarding, privacy pages and backup screens. Suggested separation: Personal (account-saved tools), Quick tools (public utilities), Business (licensed workspaces). Explain sign-in at the save boundary rather than repeatedly prompting on public learning/calculation screens.

## Implementation order

First build and verify the shared personal identity, ownership and storage foundation. Then convert Hisabio and Kiraya Saathi, followed by JapSeva, Focus and Timetable Lite. Next move explicit saved features in Ritvayam, Ritual Assist and Moment Studio. Resolve Satire/Feedback identity policy, complete wrapper sign-in, revise online-only/recovery copy and run cross-browser/re-login acceptance tests before launch. This is broader than simply adding Google sign-in to eight pages.

Acceptance must demonstrate: create/save, close/reopen, clear browser data, sign in again, open another browser/device, retrieve the same records, reject another account's IDs, handle expired sessions and failed/retried writes, and preserve existing business roles/records. Use isolated test data; do not reset production business data. Do not describe any of these new capabilities as implemented yet.

## Evidence and verification limits

Inventory and aliases: `packages/app-registry/index.js`, `server/static-assets.js`. Personal storage: `apps/rozhisab/frontend/storage.mjs`, `apps/rozhisab/frontend/sw.js`, `apps/kiraya-saathi/frontend/storage.mjs`, `apps/japseva/frontend/storage.mjs`, `apps/focus/frontend/app.js`, `apps/focus/frontend/focus-timer.mjs`, `apps/timetable-lite/frontend/app.js`, `apps/rashifal-kundli/frontend/saved-kundli.mjs`, `apps/ritual-assist/frontend/checklist-state.mjs`, `apps/ritual-assist/frontend/calendar-input-memory.mjs`, `apps/moment-studio/frontend/certificate-app.js`.

Public tools: their app frontend modules/READMEs, `apps/take-a-break/frontend/app.js`, `apps/daily-spark/frontend/play.mjs`. Public identity: `apps/satire-arena/backend/edge.mjs`, `apps/satire-arena/frontend/reaction-controller.mjs`, `apps/feedback/backend/service.mjs`, `apps/feedback/README.md`. Restricted apps: app-owned backend routes and organisation-edge modules, `apps/pandit-booking/backend/service.mjs`, `apps/advocate/backend/client-access.mjs`. Shared identity/access: `packages/auth/`, `apps/portal/backend/edge.mjs`. Android: `apps/android-wrapper/README.md`.

This is a source-level audit of current code and documented architecture, not live penetration testing, a production database inspection or a completed Google integration. No runtime tests were necessary for documentation-only changes. Existing production deployment/verification claims remain as recorded separately in the functionality ledger.

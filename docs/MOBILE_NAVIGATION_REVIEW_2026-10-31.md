# Mobile navigation verification release — 31 October 2026

User instruction: implement the attached mobile UX/navigation/performance brief,
deploy for verification, and leave all changes uncommitted.

## Root cause and implementation

The platform is a collection of vanilla JavaScript apps with native document
navigation, not a single SPA. Several app controllers used `replaceState` for
deliberate section changes, and others kept sections only in JavaScript variables.
Consequently WebView/browser Back skipped those screens. The Android wrapper's
existing Back handler already calls `web.goBack()`; no native interception or
replacement APK is needed for the website history changes.

Real screen transitions now create entries; initial rendering, language changes,
and unchanged selections do not manufacture a landing entry. Restoration never
pushes another entry. No Back cancellation, exit trap, or dependency was added.

| Area | Implemented behavior |
| --- | --- |
| Shared navigation | Small `packages/ui/navigation.mjs` helper; app-switcher overlay supports Back/Forward and direct links. Explicit close returns to its parent, with a local fallback for direct entry. |
| Chambers | Section history, in-memory search/filter/scroll restoration, record and form routes, direct refresh, Back closes record/form before leaving the section. Unsaved ordinary form fields survive Back/Forward in tab memory; successful saves clear the draft. Files require reselection after rebuilding a form. |
| Ritual Assist | Guide selections create entries; Back restores a guide without losing checklist/search state. Checklist preview is a shareable overlay with Back/Forward/direct-entry behavior. Calendar tabs have reversible view URLs. |
| Take a Break | Activity routes support Back/Forward; mounted boards remain in memory. All activities returns to the hub even after switching games or entering a direct link. Failed lazy imports leave the hub usable. |
| BatchFee Lite | Section and student-ledger URLs restore on traversal and refresh. Views retain search/filter state in memory. Renamed the old `history()` renderer to avoid shadowing the browser History API. |
| Tournament Lite | Tournament and tab URLs restore only after successful authorized loading, including shared read-only views. Refresh stays on the selected tournament/tab. |
| DIGITAL SAMAJ | Authorized community, section and profile routes restore on Back/Forward and refresh; existing draft-saving and API access enforcement remain in place. |
| Feedback | Discussion URLs create real entries and restore dialogs on traversal while retaining list controls. |
| News | Explicit edition-date changes create entries; Back/Forward restores the selected date without generating a new edition. |
| Sign-in | Validated same-origin return paths stay within the requested app. Replacing the completed sign-in screen prevents Back/redirect loops. No arbitrary redirect destination is accepted. |

Other public tools already use native links between pages or a single workspace
with editable controls. Editable values/share-URL updates are not separate screens
and do not create an entry for each keystroke. Existing API validation,
organisation/licence enforcement and persistence are unchanged.

Verification also exposed a missing Ritual Assist source panel: print handlers
still referenced the removed element. The existing guide-source records now
appear in a compact expandable section and in bilingual checklist downloads;
printing can expand that section safely. Sources and calculation rules were not
invented or replaced.

## Mobile layout and delivery

Shared dialogs use dynamic viewport height, safe-area allowances, contained
scrolling and accessible mobile controls. Dialog text fields use a 16px font on
mobile to avoid automatic input zoom. Scroll margins account for the fixed header.
Ritual Assist's mobile hero, gaps and notice spacing are more compact, using its
existing theme tokens. No global overflow clipping hides layout defects.

The navigation loading overlay appears only after 180ms, avoiding a flash on fast
native transitions; it still clears on page visibility/history lifecycle events.
Existing on-demand game/astronomy modules, content-hashed edge assets, compressed
delivery and local-only Vedic privacy boundaries remain intact. No new library,
font, image or background polling was added. This is not a measured production
Core Web Vitals or field INP improvement claim.

## Verification

New Chrome regression coverage lives in
`apps/portal/tests/navigation/browser.spec.js`: three-level guide/preview history,
game board restoration, overlay direct refresh, workspace routes and record
details, unsaved form traversal, validated sign-in returns, community navigation,
feedback, calendar/News navigation, lazy-import failure, and responsive layout.
All writes in these tests use isolated temporary SQLite data.

The first public layout sweep passed on 15 routes at 320, 360, 375, 390, 412, 430,
768 and 1440px in light/dark themes (240 route/width/theme combinations), plus a
320×360 dialog check. The initial public navigation checks and the focused
workspace/authentication checks also passed. The final isolated Chrome run passed
5/5, including all three complete Chambers workflows, the learning journey and
the nineteen-route shared-frame/switching sweep. Other affected BatchFee, Samaj,
Feedback, Ritual calendar/checklist, game and tournament workflows were covered
by `.publish/mobile-ux-browser-tests.log` and targeted corrected reruns.

The full API run recorded 583 passing checks out of 586, with a timetable search
limit and two workerd runtime/timeout failures under concurrent load. A serial
focused run passed those timetable/workerd scenarios; its only remaining failure
was an old assertion excluding source URLs from checklist exports. That assertion
was updated to match restored provenance, and the final source/export group
passed 8/8. Full-run and retry evidence: `.publish/mobile-ux-api-tests.log`,
`.publish/mobile-ux-final-api.log`, `.publish/ritual-learning-unit-final.log`.
This is combined verification evidence, not a claim that one full-suite run was
entirely green. `git diff --check` passed.

The production-config dry run passed, and the uncommitted working tree was deployed
with `--keep-vars` as Worker `a0fc697f-f684-4d95-9eca-f748fb4e3aab`.
Git HEAD remains `ec6f37a`. Live Chrome passes guide/learning/checklist history,
game board restoration, app-switcher Back/Forward, 54 width/theme combinations,
short-dialog geometry, health 200 and the unscoped-records 409 boundary. No page
errors or production business writes. Evidence:
`.publish/ritual-learning-mobile-{dryrun,deploy,live}.log` and
`.publish/mobile-ux-live-verification.json`. The verification browser stubbed the
visitor counter and blocked business writes. Existing organisation/D1 bindings
were retained; no migration or licence/account change was performed.

Real Android hardware, iOS Safari, installed-PWA keyboard behavior, predictive Back,
and real-device performance metrics require device verification. A short Chrome
viewport checks dialog geometry, not an actual operating-system keyboard. Private
production workflows are not exercised with real business writes. Specialist
dialogs outside the routed record/preview/switcher flows retain their existing
behavior; this release does not claim universal history serialization of every
transient editor, file picker or print dialog.

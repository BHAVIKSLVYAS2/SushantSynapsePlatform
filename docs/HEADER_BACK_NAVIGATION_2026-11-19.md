# One shared header Back — 19 November 2026

The shared platform header adds one icon-only left arrow with a 44px touch target
and an accessible English/Hindi/Gujarati Back label. Home has no redundant arrow.
On mobile it takes the logo's space, retaining the app switcher, language, theme
and account controls. At narrow widths the app name truncates visually while
retaining its full accessible text. Screen/export mode remains excluded.

The shared button dispatches cancelable `synapse-navigate-back` on window first.
An app may prevent the default to handle transient views without altering records.
Otherwise it uses browser Back only with a different same-origin referrer and
available history. Direct/external-entry fallback is the current app's root for
a nested route, or platform Home for an app root. It does not send users to an
external referrer. Other apps retain this generic fallback until they explicitly
provide their own view navigation; it does not invent their internal form history.

JapSeva handles the event in this order:

1. While saving, consume the action without interrupting the write.
2. Open Library reading → filtered contents, preserving search/scroll/focus.
3. Open certificate → its request detail.
4. Focused request → ongoing/completed list.
5. Form/tab → previous app view, restoring list query and a still-valid request.
6. Empty internal history → ongoing root, then shared navigation fallback.

The in-memory view stack is capped at 30 entries. Existing form values remain
in their controls; navigation does not reset them or create practice records.
No browser-history monkey patch, stored history URL log or database schema change.
Reading-to-form Back restores the reading before a subsequent Back returns to
contents. The duplicate in-content book/practice Back controls are hidden only
when the shared shell is present; they remain as fallback controls without it.

Ownership: `packages/ui/platform-shell.js` and `.css` own the shared control;
the generated `platform-shell.bundle.js` is rebuilt by `build-catalogue.cjs`.
Kundali embeds shared CSS in its generated application stylesheet, and Home uses
its CSS bundle, so both must be regenerated before their layout can be verified.
JapSeva's controller owns its view stack; collection-view exposes `back()`.

Verification:

- 84 final layout cases: seven app routes × four widths × three themes;
  44px Back target and no horizontal overflow, including 320px Kundali.
- Direct reading links, form/read/list/certificate returns, compact header,
  Hindi accessible label, nested-route fallback and external-entry fallback.
- An existing fixture request retains its completed count; no navigation write.
- 36 final book language/theme/width cases plus index resume/reload, filtered
  navigation, keyboard, reduced motion and no reading-generated practice records.
- Eight Node content/storage/delivery and four catalogue checks pass. All twelve
  JapSeva browser workflows pass. Final production asset build passes (735 assets).

Evidence: `.publish/header-back-checks.json`, `.publish/japseva-header-back-mobile.png`,
`.publish/japseva-book-checks.json`, `.publish/header-back-japseva-regression/`.
Local only; this request does not include a commit/deployment instruction.

# Mantra Library book navigation

Reading settings correction (23 November 2026): the nested Ratna mantra paragraphs
now use the existing book size/spacing variables; previously both selections left
them at 21px. Controls retain their options/defaults and stored preferences.
Changing typography cancels active page-turn overlays. Browser verification covers
short readings, chapters, Ratna, Recite/Learn, Reset, reload and resize mid-turn.
No navigation or stored-record changes. Release evidence is in the ledger.

23 November 2026. User requested one Previous/Next pair, keeping the corner
arrow and adding a page-turn effect that lifts from the corner.

The book footer is now the sole visible Previous/Next pair. The old cross-reading
footer is detached from the book, compact chapter readers omit their own buttons,
and Ratna steps use the shared footer. Chapter selectors, reading modes, settings,
contents and the corner remain available. Standalone practice chapter readers keep
their controls because they do not have the library book footer.

The book shell captures the outgoing page before a chapter/ritual-step change,
then runs one shared corner-peel animation after the destination is rendered.
Single-reading transitions use the same animation. Forward turns peel from the
lower right and reverse turns mirror the page geometry. Snapshot controls are
inert and hidden from assistive technology; hidden library headings retain their
snapshot styling and native details summaries do not acquire fallback labels.
Rapid taps replace unfinished animation; returning to Contents clears overlays.
Reduced-motion preference bypasses snapshots/animation and cancels active motion.
No practice records, source text, audio, calculation or storage schemas change.

Verification: 42 focused Node checks pass across JapSeva, Hisabio, Kiraya Saathi
and shared care. Chrome checks one visible pair, corner forward/reverse turns,
intermediate polygon geometry, inert overlays, rapid taps, cleanup on Contents,
Ratna movement and reduced motion. Ratna's nine-guide workflow passes; the
no-login backup/PDF/certificate and complete Rudram reader/practice workflows
pass. Build results are recorded in the functionality ledger. A paused mobile
turn screenshot was visually inspected. Earlier all-entry Devanagari, eight
Hisabio and nine Kiraya workflows remain covered by this session's evidence.

Release scope includes this session's already-tested Devanagari preference,
Hisabio delete-service confirmation, Kiraya Home option, and the previously
deployed Ratna source that had not yet been committed. Production deploy keeps
organisation/auth/D1 and disabled Nishi settings; no migrations or business writes.

Implementation committed as aa0261be and deployed with --keep-vars as Worker
f27115f6-578e-4438-8fde-7bbd534b9749. The final build exports 765 assets. Live
Chrome passes 34 checks covering fifteen exact assets, health/home/protected API,
navigation and animation, Ratna, eight responsive theme layouts, three languages,
Hisabio loading and Kiraya's Home option. No page errors or business writes.
Live mobile and paused-turn screenshots inspected. Evidence is under .publish:
book-navigation-production-deploy.log, book-navigation-live.cjs and
book-navigation-live.json. Release documentation is republished separately;
the final runtime identifier is in book-navigation-documentation-deploy.log.

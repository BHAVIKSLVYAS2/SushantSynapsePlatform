# Mantra Library book UI — 19 November 2026

The existing Library is now a text-based book with two distinct views:

- **Contents:** numbered compact entries, search, category/deity filters, request
  a mantra, closed reading help/licences and a continue-reading shortcut.
- **Reading:** one selected mantra/collection, a return-to-contents button,
  existing meanings/script aids/chapter selection and practice action. Previous/
  next reading follow the filtered order. Arrow keys also move between readings
  outside form fields and the chapter reader.

Follow-up: the return arrow now lives in the shared platform header. The duplicate
book/practice arrows are hidden when that header is present. Header Back also
handles request detail, certificate and previous form/tab navigation. See
`HEADER_BACK_NAVIGATION_2026-11-19.md` for the shared fallback and app scope.

The contents have two columns on desktop and one on mobile. The paper edge,
serif book headings and quiet surfaces inherit platform light/dark/deep tokens.
Text stays selectable and reflows; long chapters still scroll rather than being
cut into viewport-dependent pages. Chapter navigation remains explicit, separate
from previous/next reading. There is no new canvas renderer or animation dependency.

A 300ms perspective/opacity page-turn runs only on the selected reading or on
chapter changes. It is cancelled before another turn, skipped for reduced motion,
and cancelled if the preference changes during a turn. Language/theme changes
do not animate every hidden reader. Touch controls retain 44px minimum targets.

Returning to contents restores the filters, search, scroll and entry focus.
The last reading ID lives in sessionStorage, alongside existing per-collection
chapter/script preferences, with in-memory fallback when storage is unavailable.
It enables same-tab reload continuation, not cross-device synchronization.
Using the Library tab returns to the index. Existing reading query links still
open their matching reading. Browser history routing is unchanged.

`collection-view.mjs` owns book/index state; `chapter-reader.mjs` exports the small
shared page-turn helper and retains all scripture handling. `style.css` owns the
scoped book layout. Required credits remain under closed Reading help. The Puja
quick chip no longer produces a duplicate active-category chip.

No mantra text, record schema, count, certificate, backup or audio licence changes.
Reading/navigation never creates a practice record or increments a count.

Verification: seven content/storage Node checks pass; 36 final browser cases cover
three languages, three themes and four widths (320/390/768/1440), plus filtered
navigation, empty/reset, resume/reload, chapter retention, keyboard movement,
animation cancellation/reduced motion, and no reading-generated practice records.
No page errors. Final mobile reading and desktop index screenshots were reviewed.
Production asset build passes (735 assets). Full existing JapSeva browser-suite
result and release state are recorded in the functionality ledger.

Evidence: `.publish/japseva-book-checks.json`, `.publish/book-full-regression/`,
`.publish/japseva-book-{index-mobile,reading-mobile,index-desktop}.png`.
Released on 2026-11-19 from source commit `b674986`, Worker version
`ec9e7b75-5c57-41c2-9abf-9402679d1fe5`. Live reading Back navigation and
84 shared-header layout cases pass. Release verification is recorded in the ledger.

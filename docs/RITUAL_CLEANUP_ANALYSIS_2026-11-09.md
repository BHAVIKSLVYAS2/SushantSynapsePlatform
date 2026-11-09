# Ritual cleanup analysis

2026-11-09 IST. Analysis only; application removals await user direction.
Scope: Ritual Assist, especially Prep, learning/readings and the new Shloki
collection. This is not a repository-wide audit. Existing uncommitted feature
work and unrelated reports are preserved.

## Confirmed obsolete paths

| Finding | Evidence | Proposed action |
| --- | --- | --- |
| Old Prep copy | `frontend/app.js` has 53 distinct copy keys. Call/data-copy analysis finds 22 unused keys; `headline` is additionally reachable only through a branch for a template element that no longer exists. | Remove 23 obsolete keys in both languages and the dead headline-rendering branch. Keep `privacy`: it is still used inside Checklist settings. |
| Repeated copy assignments | Seven keys have repeated definitions per language: `download`, `copy`, `reset`, `savedWithChecks`, `savedWithoutChecks`, `rememberChecks`, `preview`; `preview` is defined three times. | Keep only each live key's final value in one dictionary. Remove dead keys rather than preserving their overrides. |
| Obsolete landing-copy renderer | `landing.mjs` loops over nine `data-landing` labels, but no current Ritual template creates any `data-landing` target. Only the search placeholder assignment still has an effect. | Remove the unused labels and loop; retain the placeholder update and live illustration/category helpers. |
| Old inline-editor print logic | `app.js` collects `details.item-arrangement` before printing. Current rows create `details.item-note` and `details.item-menu`, not `item-arrangement`. Thus this collection is always empty on current entry points. | Remove the empty print-state bookkeeping. Keep the actual PDF dialog, print class, showing filtered rows and restoring filters after print. |
| Old focus exception | `applyFilters()` checks for an active `input[data-arrangement]`. No current Ritual module creates that input. Editing now uses a separate dialog. | Remove this unreachable exception; retain all actual readiness/assignment filtering. |
| Obsolete CSS families | Current markup/controller review finds no producers for `.preparation-summary`, `.learning-scope`, `.item-arrangement`, `#copy-fallback`, `#copy-text`, or Prep `#scope.compact-guidance`. These survive in style/density/gallery/arrangements/mobile CSS. | Prune only selector branches with those obsolete targets. `.scope`, `.reference` and `#scope` alone remain active on the calendar and must not be removed globally. |

The 23 obsolete copy keys are `eyebrow`, `headline`, `intro`, `choose`,
`copyFallback`, `steps`, `variation`, `ask`, `references`, `download`, `copy`,
`share`, `print`, `downloaded`, `copied`, `shared`, `fallback`, `printNote`,
`cancelled`, `link`, `details`, `more`, and `preparation`.

## Duplication requiring consolidation

1. `learning.mjs` and `shloki.mjs` independently implement lazy disclosure loading,
   cached import promises, loading/error messages and route restoration. Their
   language/retry lifecycles differ, so this is refactoring rather than deleting
   one file. Prefer a small app-owned helper if it reduces real complexity;
   preserve lazy loading and each reader's state.
2. `readings.mjs` and `shloki-view.mjs` separately implement selection,
   Previous/Next, position status and larger type. Chapter resume uses an existing
   localStorage key; Shloki uses the URL and no new saved state. Share only common
   controls where useful; do not silently change either persistence policy.
3. `learning-view.mjs` and `shloki-view.mjs` duplicate the UTF-8 BOM/Blob/object URL/
   download link/revoke flow. A small app-owned text-download helper can replace
   the repeated mechanics while retaining separate content and filenames.
4. `guide.steps` and `learningFor(guide).steps` are competing sequence sources.
   The learning screen now renders the former; learning downloads use the latter.
   A read-only probe confirms Ganesh shows four steps but downloads six. Choose
   one reviewed sequence and render/export it consistently. Do not delete the
   richer learning sequences without reviewing their unique ritual instructions.

Tiny `node`/`el` element factories and bilingual `pair` helpers are repeated but
do not justify introducing a broad component framework by themselves.

## Components/content for user decision

| Candidate | Recommendation |
| --- | --- |
| Repeated generic item guidance | Keep one shared note per ritual. The identical family-reference note occurs 64 times in Day 11 and 33 times in Day 12, in addition to the shared-note disclosure. Preserve unique material-specific guidance and quantity/confirmation rules. |
| `readingRights` paragraph | Remove this long visible editorial/copyright explanation from the old reader; retain provenance in the source review documentation. It is live content, not dead code. Its export inclusion must be considered separately. |
| Daily/Ganesh/Lakshmi reading companions | Review removal or merger: these three packs contain original reflections/preparation and newly written prayers, overlapping the purpose of preparation plus authentic prayer sections. They are not traditional aarti lyrics. Keep Satyanarayan's distinct five-part story summary unless explicitly retiring it. |
| Readiness dropdown and quick buttons | Both expose All/Needed/Arranged, but the dropdown additionally exposes Unassigned. Simplify to one control set only if Unassigned remains available and accessible. Not confirmed unnecessary. |
| Multiple source disclosures | Learning and Shloki cite different text sets. Presentation may be consistent, but deleting a source section would remove provenance. Keep sources available. |

## Legacy compatibility: review separately

The current `workspace.mjs` always mounts the calendar controller before Prep.
Consequently `workspace-nav.mjs` is already mounted when Prep calls it; the old
`active === 'checklist'` initialization branch never installs its leaving/draft
listeners on this route. The workspace capture handler also owns section
switches, retaining the Prep DOM in memory. The older
`ritual:leave-checklist`/sessionStorage route-and-draft bridge is a retirement
candidate, not a reason to delete saved data. Preserve or explicitly migrate any
pre-existing legacy draft import before removing its reader. Verify direct guide
links, calendar entry links, tab return, Back/Forward and refresh behavior.

`preparation-pack.mjs` has no current screen caller but is publicly allowlisted,
covered by calendar-export/Seedha tests and explicitly retained in architecture
notes. It is an existing compatibility/export contract. Do not delete it or the
guide `materialReview`/`checklistText` fields merely because the latest screen no
longer displays the editorial review: exports still consume them.

## Keep

- The 19 source-reviewed Shloki readings and their source references.
- The older source-checked Sanskrit prayers. A normalized comparison found zero
  exact Sanskrit matches with the new Shloki collection; two prayer interfaces
  do not prove duplicate text.
- Checklist custom items, names, quantities, responsibility, checkmarks and dates;
  image/PDF sharing, filtering, undo and explicit saved-checklist deletion.
- Calendar engines, location inputs, Vrat/Shraddha exports, authentication,
  organisation scope, databases, migrations and recovery contracts.

## Audit evidence and proposed sequence

Parsed all 36 current frontend JS/MJS modules with Node's bundled Acorn parser,
including untracked Shloki files: zero parse failures. The declaration scan found
no unreferenced non-exported declarations; this does not detect semantically
unreachable branches or prove exported functions unused. Followed template,
controller, registry and test references for the findings above. Read-only probes
confirmed sequence mismatch, repeated notes and absence of exact prayer overlap.
No browser retest, build, dependency change, production request or application
code edit was performed during this audit.

Recommended implementation order after discussion:

1. Remove confirmed obsolete copy, branches and selector families.
2. Unify the displayed/exported sequence and repeated text-download mechanics.
3. Apply the user's choices on generic companions and repetitive visible content.
4. Handle legacy navigation compatibility separately; retain data import safety.
5. Run focused data/export/state tests and browser coverage for all Prep languages,
   Shloki history, checklist editing/retention, PDF/image export and themes, then
   check frontend packaging. Report verified results before any release.

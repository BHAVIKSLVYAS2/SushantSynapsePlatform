# Launch data model and initial reuse review

15 November 2026. Analysis only: no authentication, storage, commercial-tier or
component changes implemented. Existing production permissions/data remain intact.

## Proposed user journeys

- Personal tools: free browsing/calculation without an account. Record-keeping
  tools can offer optional Google sign-in and personal cloud synchronization.
- Business workspaces: licensed access, shared organisation data and existing
  role enforcement. A personal account must not automatically receive business
  membership or a licence. Preserve existing account sign-in/linking options.
- Show storage independently of pricing: “Saved in this browser” versus “Saved
  to your account.” Free/paid alone does not explain where records live.

Google sign-in establishes identity; application record storage and sync need
their own backend. Stable cross-browser access should use an account-owned
database with an offline device cache. Signing in alone cannot recover another
browser's existing local records. Existing local data needs an explicit import/
merge step with ownership, conflict and sign-out handling; never silently replace
or upload existing records. Local-only portable files require export/import.
An installed browser app does not itself solve cross-browser synchronization.

Primary references reviewed:
- [Google identity and API authorization](https://developers.google.com/identity/gsi/web/guides/integrate)
- [Backend identity verification](https://developers.google.com/identity/gsi/web/guides/verify-google-id-token)
- [Browser-specific storage](https://developer.mozilla.org/en-US/docs/Web/API/Storage_API/Storage_quotas_and_eviction_criteria)

This proposal is not a claim that Google sign-in or personal cloud sync exists.
Current browser-only tools and existing organisation services remain as released.

## Initial reuse/performance findings

Scanned 273 unique registered HTML/JS/CSS source/output files, deduplicating URL
aliases to the same physical file. No byte-identical duplicate files found.
This is an initial asset scan, not a complete structural-HTML or runtime audit.

Review candidates:
- Dialog/form scaffolding across Chambers, Tournament and standalone tools.
  Share focus, validation/error and action mechanics while retaining app rules.
- PDF object/xref writing in packages/ui/canvas-pdf.mjs and Kundali report-pdf.mjs.
  Shared encoding can accept separate app renderers/page dimensions.
- Repeated disclosure, filter/empty-state and field layout conventions. Component
  extraction should follow repeated behavior, rather than appearance alone.
- Large raw registered assets: Kundali shared chunk ~728 KB, home-calendar
  ~702 KB, sensitivity-worker ~652 KB; shared language.js ~290 KB and home CSS
  ~166 KB. These are file sizes, not measured compressed network transfers.
  Inspect dependency graphs, lazy-loading boundaries, caching and actual load
  traces before promising speed or size gains. Generated HTML/bundles should be
  changed through their generators, never hand-edited.

Suggested sequencing: settle launch/storage journeys; measure representative
mobile loads; extract low-risk shared mechanics; review heavy dependency delivery.
No refactor has been performed and no quantified performance gain is claimed.

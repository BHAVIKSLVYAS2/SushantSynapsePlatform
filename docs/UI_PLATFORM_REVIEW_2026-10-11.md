# Platform UI continuity review — 2026-10-11

## Implementation follow-through

The authorized implementation introduces a persistent shared platform header across all served pages, a searchable app switcher, shared theme/account placement, coordinated app toolbars and desktop sidebar placement. Home cards now use consistent geometry and compact headings; Chambers uses a direct overview title. Conflicting Studio theme defaults and independent colour tokens were removed, and runtime working-heading decoration is no longer loaded. Keyboard and scroll restoration are covered by browser workflows. Verification and release status are recorded in the functionality ledger; the original findings below describe the pre-change source.

## Finding

The platform shares authentication, theme infrastructure and header styling, but does not yet share a coherent navigation shell. The transition from discovery to app work changes too many structural cues. Shared decorative treatments have not resolved this.

This is a source review, not a completed rendered-screen usability audit. No UI implementation, browser verification or deployment was performed for this review.

## Evidence

- `apps/portal/frontend/index.html` and `publicHome()` in `platform.js` provide a public shortcut rail, promotional hero, large illustrated cards and public/private sections.
- The authenticated `render()` in `platform.js` introduces another sidebar with apps, favourites, recent launches and account management.
- `apps/advocate/frontend/app.js` introduces a Chambers-branded sidebar, firm selector, Workspace/Practice navigation, separate mobile navigation and an All apps return link. The shared platform header exists, but platform navigation is no longer persistent.
- `packages/ui/workbench.js` decorates dynamically rendered headings and sections with artwork. This creates visual resemblance without establishing common navigation, layout ownership or hierarchy.
- The opening rules in `packages/ui/workbench.css` give Moment Studio a separate midnight/glass/neon treatment. Architecture and the ledger also record its different initial theme behavior. Shared preference handling alone does not establish a shared visual experience.
- Portal presentation is layered through platform CSS, shared header CSS, premium CSS and home CSS; Chambers uses its own style CSS followed by shared layers. This makes consistency depend on selector precedence across independent layouts.

## Recommended direction

1. Establish one platform shell for `/`, the signed-in catalogue and implemented app routes: the same platform identity, header geometry, app switcher, theme control and account/sign-in placement. Public visitors can use the shell without an account. App access remains enforced by the API.
2. Separate platform navigation from app navigation. Desktop app navigation sits below the common header in a consistently sized sidebar. On mobile, keep a common header/app switcher and an app-specific navigation drawer or bottom navigation with consistent interaction rules. Do not stack two bottom bars.
3. Make `/` a usable app launcher: compact consistent cards, search/categories, clear access labels and a brief introduction. Signed-in users get their accessible apps, favourites and recent launches. Move extended promotional storytelling to the existing showcase page. Keep support links secondary.
4. Adopt shared typography, spacing, surfaces, borders, control sizes, focus states, dialogs and empty/loading/error patterns. Put these components and tokens under `packages/ui`; keep workflows under their owning apps. Replace conflicting presentation rules as apps adopt the components rather than adding another override layer.
5. Keep app identity in restrained accents, an app mark and task-specific content. Games, newspapers and creative previews may retain distinct content design; navigation and account controls should remain familiar. Use the same initial theme policy across apps and preserve saved light/dark/system preferences.
6. Use direct working titles such as "Chambers overview", "Cases" and "Hearings". Keep illustrations on launcher cards and useful empty states; reassess decorative artwork beside routine working headings.

## Implementation sequence and acceptance

First implement the shell on home, signed-in catalogue and Chambers, including sign-in and unavailable/access-denied states. Review the actual home → sign-in → Chambers → switch app → home journey before extending it to other apps. Do not redesign every app independently.

Validate desktop and mobile in light/dark/system themes. Across transitions, platform identity, theme/account placement and switching behavior must stay consistent; current app/page must be obvious; primary work should be visible without an oversized promotional header. Verify keyboard navigation, focus, touch targets, overflow and existing app workflows. Use isolated test data, preserve records and document blobs, and keep print/export artwork outside the shell styling.

Completion requires rendered comparisons and browser workflow evidence. Matching colours or loading the same stylesheet is insufficient.

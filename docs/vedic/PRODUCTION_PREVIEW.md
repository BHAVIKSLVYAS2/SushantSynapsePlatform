# Production verification preview

The user explicitly authorised public production routes on 2026-10-25 to begin
verification there. This supersedes earlier no-public-route checkpoints, without
accepting independent calculation, editorial or traditional-source gates.

Entry: https://apps.sushantsynapse.com/rashifal-kundli

The platform catalogue contains one clearly labelled preview card. Its navigation
opens Kundli, Rashifal, Time Machine and Matching. All calculation code is bundled
for the browser; no Vedic birth API, database table or account vault is added.
Birth input/results remain in tab memory. Existing explicit offline exports and
optional Rashifal sign preference retain their separate controls.

Pages use no-referrer, no-store, noindex, disabled device permissions, same-origin
opener isolation and CSP connect-src none. No shared availability fetches, ads,
analytics or external fonts are injected. These controls do not protect against
browser extensions, shared-device access or deliberate user downloads. Static
asset requests still reach the host; birth values do not enter their URLs.

Independent source, publisher sunrise, uncertainty-bound, rulebook, optional-varga
and native-language editorial acceptance remains open. Full Shadbala, birth vault,
client portal and providers remain unavailable. The release-readiness evaluator
continues to block a validated general release; publicRoutesEnabled and
verificationPreview describe this separately authorised testing exposure.

Build: apps/rashifal-kundli/build.cjs, invoked by the shared frontend build.
Node serves prepared bundles and reports the preview unavailable if they are
missing; it does not compile frontend code or require build tools at startup.
Only explicit generated frontend assets enter the public export; generated
bundles are ignored and rebuilt from source. Public routes are owned by
apps/rashifal-kundli/public-assets.cjs; privacy headers are shared by Node and both
Cloudflare page handlers. No migration, bootstrap or existing business-data write
is part of this release.

Verification and deployment outcomes are recorded in PROGRESS.md and the
functionality ledger. P17's earlier local-only evidence remains a historical
checkpoint; its current reference report tracks the authorised preview changes.

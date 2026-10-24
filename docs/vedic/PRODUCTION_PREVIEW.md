# Production verification preview

LIVE: implementation 46c81a6 plus privacy correction 420572b, final Worker
0ad599ab-aaa6-4ff4-8a71-a5c15bfa8e70. Final live Chrome passes all four workflows;
settled HTTP verification passes 28 checks including absent hosting analytics
markup. Initial injection and deployment-propagation failures are retained in the
ignored evidence logs; see PROGRESS.md. No migration or business-data writes.

The user explicitly authorised public production routes on 2026-10-25 to begin
verification there. This supersedes earlier no-public-route checkpoints, without
accepting independent calculation, editorial or traditional-source gates.

Entry: https://apps.sushantsynapse.com/rashifal-kundli

The platform catalogue contains one clearly labelled preview card. Its navigation
opens Kundli, Rashifal, Time Machine and Matching. All calculation code is bundled
for the browser; no Vedic birth API, database table or account vault is added.
Birth input/results remain in tab memory. Existing explicit offline exports and
optional Rashifal sign preference retain their separate controls.

Pages use no-referrer, no-store/no-transform, noindex, disabled device permissions, same-origin
opener isolation and CSP connect-src none. No shared availability fetches, ads,
analytics or external fonts are injected. These controls do not protect against
browser extensions, shared-device access or deliberate user downloads. Static
asset requests still reach the host; birth values do not enter their URLs.
Initial live checks detected hosting-injected Cloudflare Web Analytics markup,
blocked by CSP but still observed by browser request instrumentation. The
no-transform directive is added to suppress hosting injection; see
https://developers.cloudflare.com/web-analytics/get-started/ . Live reruns must
verify absence of beacon markup and third-party requests, not merely blocked
analytics execution. Initial deployment: cc5e9ece-9ae0-4ee7-883f-cb512333fff4.

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

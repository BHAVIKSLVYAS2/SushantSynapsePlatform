# Quiet sponsorship plan

WhatsApp enquiries are configured for user-supplied +91 78741 66009. Contact, Support and Sponsorship forms combine messages; visitors review them, open WhatsApp and press Send. Support/Demos are prominent in shared navigation/homepage. This is an enquiry channel, not automatic delivery or payment verification. Existing payment settings and agreed sponsorship publishing remain separate. Historical local-draft-only descriptions below precede this update.

## Voluntary support

`/support` is deployed, adapted from `C:\Code\ContemptUniverse\src\web\app\support\page.tsx` with platform styling. No payment recipient is configured. Sign in as the platform Owner, open `/support`, expand **Manage support settings**, enter a recipient display name and verified UPI ID or HTTPS payment link, then enable and save. The public destination changes immediately on the running Node instance. Only owners can read drafts or write settings; invalid UPI IDs, non-HTTPS/credential-bearing links and enabled empty configurations are rejected server-side. Details persist under `platform-support` in SQLite and full SQL export; disabled drafts are excluded from public responses. Both server and frontend are deployed; configure the recipient through the production Owner account.

UPI takes priority when both destinations exist. ₹20 Chai, ₹49 Coffee, ₹99 snack and ₹249 meal choices build a UPI deep link and matching local QR with recipient, INR amount and contribution note. HTTPS-only checkout gets its own QR/link; amount tiles are hidden because a generic hosted URL cannot guarantee the amount. Copy uses clipboard with a manual selection fallback. No static third-party QR images, payment credentials, confirmation, receipts, recurring charges, paid entitlements or payment-history records are implemented. Visitors must check the recipient in their external app. Backend failure hides payment controls rather than reusing an old recipient. No contributions or revenue have been observed or claimed.

The sponsorship panel links to the existing `/sponsor` workflow. No AdSense account or ad-view reward is connected, and this page loads no advertising scripts. The source's ad-view promotion is replaced with the platform's existing partnership opportunity. QR implementation is vendored from the source's installed `qrcode` package (1.5.4), bundled with its `dijkstrajs` dependency using esbuild's ESM browser output. The source project is unchanged. Licenses: `apps/portal/SUPPORT-QR-LICENSE.txt`. Existing sponsorship publishing rules below still apply.

## Google advertisement placement preview

The six existing public sponsorship locations also show a separate responsive placeholder labelled "Advertisement · Preview", "Google ads will appear here" and "Reserved ad space · Integration pending". It is a visual layout preview only, excluded from print. No Google script, publisher account, ad request, consent service or revenue integration is connected. Private workspaces have no preview. Direct sponsorship remains separate.

This release prepares **direct sponsorships**, not an ad-network connection. There are no booked advertisers, connected payment services, measured revenue or verified audience figures. The public homepage invites potential sponsors; empty app slots are hidden. The public enquiry contact remains unset until the owner supplies a public business address.

## Why this model

Sell a reviewed text placement for an agreed period and fixed fee. It gives the platform control over copy, destinations and density, without loading third-party ad scripts. Start with a useful education, stationery, printing, workshop or everyday-service advertiser. Do not accept misleading claims, gambling, adult content, invasive tracking destinations or disguised editorial endorsements. Sponsors never influence random selections, puzzles, scheduling or news coverage.

Google requires site approval before AdSense can serve ads, and its placement guidance cautions against misleading headings and ads close to interactive controls. Its policies are not approval of this platform. See [site approval](https://support.google.com/adsense/answer/12169212?hl=en) and [placement policies](https://support.google.com/adsense/answer/1346295?hl=en). Consider network ads later only with an actual approved publisher account, a deliberately reviewed consent/privacy setup and manual placements; keep automatic overlays, anchors, vignettes and autoplay disabled. No network adapter or consent platform is installed in this release.

## Earning sequence

1. Supply the public sponsorship enquiry email. The `/sponsor` page can then create an explicit mailto draft addressed to it; sending remains the advertiser's action. Until configured, the page honestly offers local draft/brief downloads and does not claim an enquiry was received.
2. Use `/sponsor` and its downloadable brief to approach a small number of suitable businesses manually. This implementation does not send outreach messages.
3. Obtain a real baseline from the owner's hosting analytics before quoting reach. Audience size, visits, demographics and conversion rates have not been verified. Do not sell guaranteed impressions or clicks; no tracking pixels or per-user identifiers are added.
4. Offer one 30-day pilot on a selected page, review the creative and destination, agree the fee and dates, then collect payment through the owner's existing business process. Publish only approved creatives. There is no self-service checkout, automatic invoice or payment verification here.
5. Review renewal based on advertiser feedback and existing aggregate traffic evidence. Report only metrics that were actually measured. A view of a page is not a verified ad impression; clicking a sponsor does not prove a sale.

An **internal negotiation example**, not a market benchmark, public rate card or revenue forecast: start a small pilot discussion around ₹500–₹1,500 for 30 days after seeing traffic. Two sold placements at an agreed ₹1,000 each would produce ₹2,000 gross before costs and applicable charges. Unsold placements earn ₹0. Adjust the offer to evidence rather than promising income. Current revenue status is unconnected.

Future optional branded/export upgrades can diversify revenue while preserving free tools, but paid watermark removal needs real entitlements and payment integration. It remains separate, unimplemented scope; this release does not weaken export branding.

## Placement rules implemented

| Page | Placement |
|---|---|
| Public home | One card after the public collections and tools, before the private workspace section |
| Team Mixer, Decision Wheel, Daily Spark | One card after the activity and explore section, before the footer |
| Timetable Lite | One card after its workspace, before the footer |
| News | One card after the newspaper/archive, before the footer |
| Sign-in, signed-in catalogue, search, Chambers, DIGITAL SAMAJ, Tournament Lite, BatchFee Lite | No placements |
| Pocket Pause, Fund Lens, all Moment Studio/legacy certificate and celebration routes | No placements |

Cards are ordinary document flow, never fixed/sticky/overlay. No popups, autoplay, countdowns, forced clicks, interstitials, auto-refresh or blocked downloads. At most one creative per page; where campaigns overlap, the first active approved match wins, with no automatic rotation. Paid cards say **Advertisement · Paid sponsorship**, name the advertiser and provide a single explicit link. External links use `sponsored nofollow noopener noreferrer` and open a new tab to preserve app work. Advertisers receive no app inputs, account details or outgoing referrer from the card.

“Hide for this visit” hides all sponsorship slots in the tab's session using sessionStorage. It is a UI preference, not tracking or business persistence; if storage is blocked, dismissal still works for that page. No cookies, pixels, impression beacons or advertising analytics endpoints are added. Print CSS hides all slots. Renderers/export code do not include sponsorship; existing branding is preserved. Below-content placements prevent initial tool controls being pushed down; empty slots consume no space.

## Publishing a real sponsor

`apps/portal/frontend/sponsor-config.mjs` is **public reviewed publishing configuration**, not a database of bookings, contracts, invoices or leads. Never put private or unpaid/unapproved proposal details, credentials or payment data in it. Those business records must use the platform's authorized SQLite/API infrastructure if a management feature is later implemented. This release adds no business tables and changes no runtime data.

Set `contact` to `{type: 'email', value: 'OWNER-APPROVED PUBLIC EMAIL'}`. Add a real agreed creative to `campaigns`:

```js
{
  id: 'your-reviewed-campaign',
  approved: true,
  sponsor: 'Real advertiser name',
  title: 'Reviewed headline',
  description: 'Reviewed description',
  url: 'https://real-advertiser.example/offer',
  pages: ['home', 'teams'],
  startsAt: '2026-11-01T00:00:00Z',
  endsAt: '2026-12-01T00:00:00Z',
}
```

This is documentation only; no example advertiser is shipped as a paid campaign. Allowed page keys: `home`, `teams`, `wheel`, `spark`, `timetable`, `news`. Name/headline/description limits: 70/100/220 characters. HTTPS destinations must have no credentials, custom port or control characters. Dates use exact UTC timestamps; the end is exclusive. Runtime validation fails closed for invalid creatives. Date gating uses the device clock, not billing records; remove expired campaigns on redeployment if authoritative removal is needed. Set `enabled: false` for a JavaScript kill switch, or remove the HTML opportunity card too to remove the no-JavaScript invitation.

Run `npm.cmd test` and `npm.cmd run test:portal`, then deploy the reviewed frontend with `npm.cmd run deploy:frontend`. All sponsorship assets and `/sponsor` are served independently by Cloudflare while the laptop backend is off. The Node allowlist also serves them when running current source; the existing production Node release does not need a restart for this frontend release.

## Enquiries and verification

The advertiser form creates a local text draft. It sends no request, stores no lead, uses no browser persistence and clears on reload. With a configured email, a mailto link appears after successful draft preparation. The brief and page disclose that email sending/payment/booking are not automatic. Without JavaScript the form stays hidden, preventing accidental GET submission of personal details.

Unit checks exercise review status, date boundaries, disabled campaigns, invalid destinations, sensitive page exclusions and configuration validation. Browser checks cover default invitation, hide persistence, no-JavaScript information, active paid fixtures on all six allowed pages, text-only rendering, safe external links, zero advertiser network requests, print suppression, mobile themes, continued team mixing and draft downloads. Test advertisers/contact addresses exist only in isolated browser fixtures, not production configuration. Production deployment evidence is recorded in the functionality ledger.

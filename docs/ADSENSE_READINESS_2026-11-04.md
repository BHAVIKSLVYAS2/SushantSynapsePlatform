# Company website and Curio readiness review

Audit date: 4 November 2026 (Asia/Kolkata). User authorised implementation and
deployment of both existing sites, explicitly without commits. This is an
evidence-based content/technical review, not a guarantee of AdSense approval.

## Featured traditions apps and recorded hero follow-up

The user subsequently requested promotion of Ritual Assist and Ritvayam plus a
hero slideshow/video demo. The company catalogue now has ten applications:
Ritual Assist (`https://apps.sushantsynapse.com/ritual-assist`) and Ritvayam
(`https://apps.sushantsynapse.com/rashifal-kundli`) lead the original eight.
Both have original audience/use/limitations guidance. Ritvayam is explicitly a
verification preview; its existing app noindex and privacy boundaries remain.
Ritual learning is described as simplified household guidance/preparation,
not a complete vidhi or a substitute for family/priest confirmation.

The hero keeps company branding and adds a manually controlled two-app video
showcase. These are real screen recordings, not generated mockups:

- Ritual Assist: 11.56 seconds; choose Ganesh Puja, mark two preparation items,
  download a genuine checklist. WebM 1,218,865 bytes, JPEG poster 79,270 bytes.
- Ritvayam: 14.72 seconds; choose Simha in Rashifal, read the traditional
  reflection and inspect the planetary table. WebM 1,401,319 bytes, poster
  53,605 bytes. No personal birth details used.

Both recordings come from the existing production static export, served on
loopback with external and non-GET requests blocked. No accounts, live business
writes or database fixture were needed. Video files are self-hosted, have English
caption tracks and written walkthrough/direct-file alternatives. They do not
autoplay, preload media bytes or automatically rotate. Switching slides and
hiding the page pause playback. Native controls support pause/seek/fullscreen;
arrow controls and keyboard selection choose the app. Reduced-motion visitors
start with paused videos, as do other visitors. Unsupported browsers can use
the transcript or direct link. No new player, framework, dependency, tracking
service or external video embed was added.

Company files added: `public/hero-showcase.js`, `public/hero-showcase.css`, and
`public/assets/demos/{ritual-assist,ritvayam}.{webm,vtt}` with matching
`*-poster.jpg` images. Updated `public/index.html`, `public/about.html`,
`public/privacy.html`, repository `README.md` and `verify.cjs`. Main privacy
now explains self-hosted video requests. Existing policies/metadata/crawl
structure and the apps production release are retained.

Platform tooling: `infrastructure/company-demos.cjs` records reproducible
public-app footage; `infrastructure/company-feature-verify.cjs` checks playback,
caption cues, controls, network deferral and responsive layouts. The existing
`infrastructure/adsense-verify.cjs` now checks ten cards and supports a
`COMPANY_PUBLIC_DIR` staging override.

Local verification passes both real video decoders and four caption cues per
clip, hidden-slide pause, arrow/keyboard selection, no initial video requests,
32 width/theme/slide states, reduced motion, no-JS alternatives and zero page
errors. Existing five-page content/metadata/link checks pass 40 additional
width/theme states. Screenshot and extracted video frames visually reviewed.
Syntax/whitespace and company production dry run pass. Apps runtime is unchanged;
the historical app-suite test debt below is neither fixed nor reintroduced by
this company-only follow-up. Final deployment/live evidence is in the ledger.

Evidence: `.publish/company-demos-capture.log`,
`.publish/company-feature-{browser-final,content,dryrun,deploy}.log`,
`.publish/company-feature-*.png` and `.publish/company-*-frame.png`.
Previous public files are retained privately under `.publish/company-feature-before`.

## Scope and findings before implementation

Reviewed every source HTML/CSS/JS and hosting file in
`C:/Code/WebsitesApps/sushant-synapse-static`, the Curio registry, public page
sources, shared footer/composition, public sitemap/robots handlers, advertising
integration, production configuration and continuation documents. Live GET
checks verified both origins, selected app pages and crawl endpoints. No private
production records/accounts were used. This was not a full security audit of
every private application.

| Finding | Evidence | Treatment |
| --- | --- | --- |
| Generic company content | Home described custom AI models, ML/cloud services and automation without examples or supporting implementation evidence. | Replace service cards with original guides to actual public applications. Keep branding and hero design. |
| Unsupported promotional statistics | Home displayed 24+ AI solutions, 99% automation focus and 24/7 intelligent systems; repository supplied no evidence. | Remove counters and claims. |
| Misleading demo navigation | “Watch Demo” linked to `#solutions`, a statistics section, not a demonstration. | Replace with clearly labelled Explore All Apps. |
| No company-to-app discovery | Company source had no links to working app routes. | Add eight direct native links and an All Apps destination. |
| Sparse trust information | About was only a four-item slogan strip; Contact a mailto CTA; only a privacy page existed. | Add substantive About/Contact/Terms, revise Privacy and expose all in the footer. |
| Missing company metadata | No canonical or social metadata; privacy lacked a description. | Unique titles/descriptions and self-canonicals on five public pages; accurate WebSite JSON-LD on home. |
| Missing company sitemap | Live `/sitemap.xml` returned 404. | Add a five-page same-origin sitemap. No cross-domain duplicate app pages. |
| Robots nuance | No source robots file; live Cloudflare managed robots returned 200 and allowed search. | Add source robots with sitemap; preserve managed crawler rules. Search was not proven blocked. |
| Rendering nuance | Company content was static HTML, but `.reveal` opacity depended on JS. Curio already pre-rendered real catalogue links and headings. | Keep static content; show it without JS. Calculators still require JS to function. No framework rewrite needed. |
| Excess decorative work | Company JS continuously animated canvas with pairwise particle lines; large hero image, remote Google Fonts and reveal/counter observers. | Remove loop and observers, use system fonts and smaller existing hero image; retain logo, layout and gradients. |
| App canonicals missing | Live QR Maker, Bill Splitter, Focus, Decision Wheel, Team Mixer and Timetable Lite had no canonical. | Add self-canonicals, also on Curio home and its three trust pages. Existing Photo/Moment canonicals retained. |
| Curio privacy drift | Notice described PIN-first calendar input, daily reactions and a separate Arena database. Code uses city IDs, annual reactions and the platform D1 binding. | Correct those specific statements; retain supported legacy PIN requests and data limitations. |
| Mobile overflow | New local 320px check found rotated decorative orbitals overflowing. | Clip decorative hero visual; recheck all layouts. |
| 404 behaviour | Original unknown company route already returned actual 404 with empty body. | Add useful 404 document, keep 404 status and noindex; no homepage fallback. |

There is no evidence identifying the precise cause of Google's decision. No
Search Console, AdSense Policy Center, consent configuration, analytics or real
user field-performance account access was available.

## Featured applications

Names, paths and icon artwork come from `packages/app-registry/index.js` and
`apps/portal/frontend/home-art.svg`. All eight returned 200 without noindex before
implementation. They are distinct public utilities, not a combined product.

| Application | Direct URL | Guide covers |
| --- | --- | --- |
| QR Maker | https://apps.sushantsynapse.com/qr-maker | Link/text/Wi-Fi, preview/PNG, static content and Wi-Fi disclosure. |
| Photo Resize | https://apps.sushantsynapse.com/photo-resize | Photo/signature crop, dimensions, KB and formats; no form acceptance certification. |
| Bill Splitter | https://apps.sushantsynapse.com/bill-splitter | People/expenses, four split methods, paise settlements and no money movement. |
| Moment Studio | https://apps.sushantsynapse.com/moment-studio | Cards/certificates, English/Hindi, exports, branding and transient personal content. |
| Focus | https://apps.sushantsynapse.com/focus | Tasks, priorities, estimates, timer and browser-local storage limits. |
| Decision Wheel | https://apps.sushantsynapse.com/decision-wheel | Options/spin/removal/share, equal entries and informal-use limits. |
| Team Mixer | https://apps.sushantsynapse.com/team-mixer | 2–100 names, balanced sizes, copy/download and no skill balancing. |
| Timetable Lite | https://apps.sushantsynapse.com/timetable-lite | Days/classes/teachers/allocations, generation, backups and bounded search. |

Each card explains its problem/audience, first steps and useful distinctions/limits.
Expandable native details keep the catalogue compact without hiding text from raw
HTML. “Explore All Apps” opens https://apps.sushantsynapse.com/.

## Changed files and implementation

Company checkout `public/`:

- Modified `index.html`, `app.js`, `privacy.html`, `_headers`.
- Added `about.html`, `contact.html`, `terms.html`, `404.html`, `robots.txt`,
  `sitemap.xml`, `content.css`, `theme-init.js`, `assets/app-art.svg`.
- Preserved existing styles/theme/modern CSS, logo assets, publisher ID, ads.txt,
  existing Cloudflare Worker identity and apex-only route. No dependencies added.
- Updated the company `README.md` and existing `verify.cjs` for the current
  navigation and installed Chrome/Playwright, with ad requests blocked during QA.
- Early theme initialization and guarded storage access; system appearance follows
  the OS until an explicit theme is saved. Static text stays visible without JS.
- Only company home retains the existing AdSense loader. Trust/404 pages have no
  ad code. No ad units, placement gimmicks or consent claims were added.

Curio checkout:

- `packages/ui/legal-html.cjs`: subtle native Company website link in the shared
  footer, composed consistently by Node and Cloudflare export.
- `apps/{qr-maker,bill-splitter,focus,decision-wheel,team-mixer,timetable-lite}/frontend/index.html`:
  add canonical metadata; no tool logic changes.
- `apps/portal/frontend/{index,contact,privacy,terms}.html`: canonicals; more accurate
  home description and specific privacy corrections described above.
- Generated Vedic HTML receives the existing shared footer through its normal
  build. Its privacy/noindex/advertising boundaries are retained.
- `tests/vedic-production.test.js`: allow canonical shared-footer navigation
  alongside the existing explicit script/asset allowlist.
- `infrastructure/adsense-verify.cjs`: repeatable local/live content, metadata,
  link, layout, storage and app-entry checks; blocks ads during browser QA.
- This report and `docs/FUNCTIONALITY_LEDGER.md` record real release status.

No schema, migration, bootstrap, auth, licences, records or document blobs changed.
No other repository access is needed for the implemented reciprocal link.

## Verification and known test debt

Both releases are live: company Worker `38f61e01-3f48-4abc-8197-41c8947e95a2`
and Curio Worker `5e20fd8b-78b7-43cb-9dac-69cdbc7f9bf1`. Curio used the existing
organisation-enabled production configuration with `--keep-vars`. Final live
browser verification passes all company checks plus nine Curio pages, reciprocal
links/canonicals, mobile layouts and an actual synthetic QR PNG download. Live
HTTP checks match company files byte-for-byte, verify app trust canonicals and
sitemap exclusions, health 200 and unscoped records 409. Ads/external services and
non-GET app requests were blocked during final app browser checks. HEAD remains
`34264a8e346f9377b541622240983db75911d072`; no commits were made.

The company JavaScript shrank from 4,079 to 1,585 bytes; the selected hero image
is 295,146 bytes instead of the previous 1,495,069-byte default. These are source
byte comparisons, not field performance measurements. Useful HTML grew from
7,160 to 15,379 bytes. Desktop and light/dark mobile screenshots were reviewed.

- Company local and deployed checks pass: five public pages, unique metadata,
  self-canonicals, 40 width/theme layouts (320/390/768/1440px, light/dark), all local
  links/assets/fragments, eight real app links, native disclosure/menu/theme,
  blocked-storage operation, no-JS visible content, sitemap/robots and true 404.
- Mobile light/dark screenshots visually reviewed under `.publish/adsense-company-*.png`.
- Focused Node checks: 14/14 pass. Full suite rerun: 601/605 pass; the footer-related
  assertion then passes in the 14/14 focused rerun. Three unrelated failures remain:
  Cloudflare source-allowlist test predates the released city-directory assets;
  Worker source bundle exceeds its historical 5 MiB test budget; ritual captured
  result hash differs while annual/pitru dates match. Do not silently refresh
  fixtures or loosen deployment budgets to report a green suite.
- In-memory baseline build with HEAD's original footer is 5,594,506 bytes versus
  5,594,563 after the link; both exceed 5,242,880. Actual production packaging dry
  run succeeds (compressed Worker approximately 861 KiB). Baseline calculation
  failure reproduces with unchanged calculation sources.
- Ten selected existing utility browser workflows pass, including real QR PNG,
  image dimensions/bytes, exact bill settlements, Focus backup, wheel/mixer undo,
  responsive themes and no-JS discovery. An additional historical launcher test
  expects 18 cards while the unchanged live registry now renders 19 (Pandit pilot);
  this catalogue-count assertion remains test debt, not an app removal request.
- Syntax, whitespace and existing production configuration dry runs pass.
- No standalone lint script exists. No physical-device or field Core Web Vitals
  certification is claimed. Browser QA blocks ad requests, so it cannot verify
  Google's eventual Auto Ads geometry.

Evidence logs: `.publish/adsense-{company-browser,company-live,company-dryrun,
company-deploy,api,api-final,focused-final,app-browser,baseline-ritual,
final-dryrun}.log`. Deployment IDs and final live-app results are recorded in the
functionality ledger after release.

Final release evidence: `.publish/adsense-final-live.log`,
`.publish/adsense-live-http.log`, `.publish/adsense-app-deploy.log` and
`.publish/adsense-company-existing-verify.log`.

## Readiness checklist and manual actions

- [x] Original, application-specific guidance instead of unsupported service claims.
- [x] Eight genuine public apps, direct crawlable links and reciprocal company link.
- [x] About, Contact, Privacy and Terms accessible in the company footer.
- [x] Unique metadata, same-origin canonical/sitemap, search crawling allowed.
- [x] Static useful content, semantic headings, keyboard/native controls, true 404.
- [x] Existing branding/stack retained; no generated SEO article farm or fake reviews.
- [x] Private workspaces remain private; verification previews retain noindex.
- [ ] Owner must confirm the published email is monitored; WhatsApp uses the existing
      published Curio number. No test message was sent. Confirm operator/legal
      identity details before making formal business-registration claims.
- [ ] Verify both domains in Search Console, submit their separate sitemaps and
      inspect representative URLs/indexing. Do not request indexing for private
      workspaces or experimental noindex previews.
- [ ] In AdSense, inspect the actual rejection/Policy Center, confirm publisher
      ownership/ads.txt and configure any required regional certified CMP/consent
      messages. Theme/beta acknowledgement is not ad consent. No account settings
      were inspected or changed.
- [ ] Preview Auto Ads on mobile/desktop before delivery; exclude overlays or
      placements that obstruct tools/navigation. QA did not generate impressions
      or click ads. Reassess Curio News/Fund third-party-source permissions if
      monetizing those pages; citations alone do not grant reuse rights.
- [ ] Review the published company copy for factual ownership/contact accuracy and
      any jurisdiction-specific policy obligations. Public operator identity and
      dedicated rights handling remain owner decisions; no compliance guarantee.
- [ ] Resolve the documented historical test debt separately. Monitor real user
      performance and indexing after recrawl, then request an honest AdSense review.

Policy references checked during the audit:

- https://support.google.com/adsense/answer/81904
- https://support.google.com/adsense/answer/12176698
- https://support.google.com/adsense/answer/7299563
- https://support.google.com/adsense/answer/48182
- https://support.google.com/publisherpolicies/answer/10437795
- https://developers.google.com/search/docs/crawling-indexing/javascript/javascript-seo-basics

These sources call for useful original content and clear navigation, and explain
that installation or technical fixes alone do not establish approval. The site
owner must still review account-specific findings and actual advertising behaviour.

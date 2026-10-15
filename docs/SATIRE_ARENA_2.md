# Satire Arena 2: implementation and operations

The existing thirteen-character Arena, six reaction IDs, signed browser identity,
changeable daily ballot, privacy deletion, SQL aggregate view and midnight IST
semantics are retained. No framework, database or artwork replacement is involved.

## Gap analysis and implementation sequence

1. Existing: genuine shared counts, browser privacy tools, animations, themes,
   reduced motion, platform discovery and local PNG exports. Added: compact feed,
   visible reaction labels, expandable square illustrations, collapsed settings,
   viewport-based portrait/expression loading and a homepage feature section.
2. Added: character URLs, explicit native/WhatsApp/copy sharing, editorial daily
   punchlines, current leaders and yesterday/30-day results from retained ballots.
3. Added: original-text posts, five fixed categories, English/Hindi content,
   draft/published/hidden states, IST scheduling, deterministic featured rotation,
   related posts, owner editor and server-rendered public pages with metadata.
4. Added: optional bounded aggregate action measurement and owner reporting,
   publishing-experiment guidance and a conservative advertising eligibility helper.
   No advertising is rendered or connected by this change.

## Editorial desk

Open `/satire-arena/editor` after signing in with a platform **Owner** account.
The initial library is empty: no sample placeholders are silently published.
Save drafts, review them, then choose Published and an IST publication time.
Future publications remain private until that time. Hidden posts return 404.
Up to 100 posts and 60 dated punchlines per character are supported. Biography
and tagline changes publish immediately. Character punchlines activate by IST
date; future punchlines are excluded from public responses. Older punchlines are
shown on the character page. A day without a dated joke uses the editorial tagline
or existing character copy. Marked featured posts rotate deterministically by IST
day; if none are marked, the eligible published library is used. No scheduler,
automatic joke generation or news ingestion is needed.

The editor offers existing local Arena artwork and text-only posts. It does not
upload new illustrations or fetch remote images. New original artwork can join
the existing reviewed static-asset pipeline. There is no public content submission.
Feedback uses the existing Contact destination; there is no automated moderation
or new report-delivery service. Publication review remains the owner's duty.

## Routes and persistence

- `/satire-arena/daily`, `/satire-arena/categories/<category>`
- `/satire-arena/posts/<slug>`, `/satire-arena/characters/<id>`
- `/satire-arena/results`: today and the preceding 29 IST dates
- `/sitemap.xml` and `/satire-arena/sitemap.xml`: eligible public content only
- `/robots.txt`: excludes API and editor paths; editor also has noindex metadata
- `/api/arena-editorial/public`: publication-filtered, read-only library
- `/api/arena-editorial/today`: small featured-joke/character summary for the home/feed
- `/api/arena-editorial`: owner GET/PUT, bounded JSON, explicit same-origin writes
- `/api/satire-arena/results`: aggregate-only history, no identity cookie required
- `/api/arena-metrics/config`, `/api/arena-metrics`: optional measurement/reporting

Editorial data uses `satire-arena-editorial-v1` in the existing SQL `settings`
table; counters use `satire-arena-aggregate-events-v1`. No schema migration is
required. Full SQL recovery includes these settings. Chambers-only JSON backups
do not become platform-wide editorial backups. Node saves compare library versions
inside a transaction; Cloudflare additionally uses the shared D1 revision guard.
Publication writes add an audit entry. Existing data and migrations remain intact.

Node and both Cloudflare handlers render public pages on the server using the
same escaped renderer. Public pages do not require JavaScript for article text,
links, metadata or lists. Drafts and future posts are excluded before rendering.
Cloudflare's existing frontend build must run before deployment to include the
new allowlisted editor and scripts. A content-store outage returns 503 rather
than a misleading empty public archive. Post/character Open Graph images use
existing pre-generated local artwork (or the platform logo for text-only posts),
not a dynamic image service. Canvas downloads contain satire labels and links;
native handoff and opening WhatsApp never claim downstream delivery.

History is a live summary of **retained ballots**, not an immutable certification:
privacy removal changes historical totals too. Ties are displayed jointly and
empty days are explicit. This remains entertainment, not representative polling.

## Measurement and 30-day experiment

`ARENA_ANALYTICS_ENABLED=true` explicitly enables first-party aggregate events in
Node or the Worker environment. Default is off. Cloudflare also requires its
existing `ARENA_LIMITER` binding; writes fail closed without it. Reporting appears
at the bottom of the owner desk. Event bodies have strict field/size allowlists,
rate limits and bounded 30-day buckets. Older buckets may expire sooner if the
700 KB aggregate storage cap is reached. Counters record page openings, saved
reactions, selected share methods, observed clipboard/download actions and tool
clicks. Referrals are reduced on-device to direct/internal/search/social/other.
No raw referrer, cookie, IP, account ID, fingerprint or returning-user ID enters
the stored metrics. Request IP is used transiently only for ordinary rate limits.

These are unverified action counts and may include bots or repeated visits. They
cannot establish unique daily visitors, returning visitors, actual share delivery
or downstream traffic. External search-console/consented audience measurement is
not connected. The owner's approximate 100-visitors baseline and 1,000 target
remain unverified goals. Plan three reviewed original posts each week and one
featured joke daily when available; compare real actions, referrals and content
popularity after 30 days. No automatic social posting is included.

`backend/ad-policy.mjs` supplies an opt-in, reviewed, after-article-only eligibility
filter for the four nonpolitical categories. It does not render ads or load a
provider. Political content and reaction surfaces remain ineligible. Actual ad
activation requires a separate explicit instruction and reviewed publisher setup.

## Release boundary

Source commit `d7841dd` was deployed and live verified on 2026-10-16 using the
existing production Worker. The functionality ledger records its version and
read-only acceptance evidence. Editorial publication, enabling analytics,
search-engine indexing and external social-card cache refresh remain separate
operational steps; no growth outcome is guaranteed.

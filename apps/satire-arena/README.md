# Satire Arena

Entry optimisation (2026-10-23, local): `/satire-arena` is the arena chooser.
It loads no voting, score polling, portraits or sound; links work without
JavaScript. Voting lives at `/satire-arena/politicians` and
`/satire-arena/news-anchors`. Actors remains Coming next. Root character query/
hash links still route to their lineup and never auto-submit a reaction.
Each voting entry has its own canonical and correct portrait preload. Run
`node apps/satire-arena/build-entry.cjs` after changing the voting template;
the shared frontend build also refreshes the generated anchor entry.

News Anchors (2026-10-23, local implementation): `/satire-arena/news-anchors`
contains six recognisable fictional television-anchor spoofs with the existing
six reactions, annual browser ballots, shared counts, profile voting, fictional
biographies, original punchlines and link/image sharing. Politics remains at
`/satire-arena` and `/satire-arena/politicians`. The arena selector and shared app
discovery cover politics, television and pop culture. Actors is marked Coming
next and has no ballots or profiles. Scores, leaders, spotlight, daily activity
summaries and exported standings are filtered to the current lineup; browser
privacy export/removal deliberately covers all arenas.

Apply all six SQLite app migrations for a new database. Existing D1 deployments
require additive `0007-news-anchors.sql`; SQL Server requires additive
`004-news-anchors.sql`. Do not rebuild or edit deployed historical migrations.
Existing votes and cookie signing keys stay intact. Anchor votes use
`arena_anchors_votes` and the shared latest-ballot view. D1's compound-query limit
requires grouping its six generations into two subqueries of three terms each.
The 1536×1024 generated portrait grid is `frontend/anchors-fast.webp`; anchor
feedback uses the existing particle effects/sound without expression-sheet swaps.
See the functionality ledger for final verification and release status.

Voting update (2026-10-18): ballots now last for the calendar year and reset only
at 00:00 IST on 1 January. The API round key is YYYY-01-01; resetsAt is the next
1 January. One changeable choice per browser and character counts each year.
Existing daily rows are retained, with the most recently updated choice per
browser/character included in yearly totals. New choices upsert the annual key;
no migration, deletion, scheduled reset or cookie-secret rotation is needed.
The 30-day activity view groups retained ballots by their last-update IST day,
independently of the yearly scoreboard. Editorial posts and spotlight remain daily.
This entry supersedes the historical daily-voting descriptions below.

Local refinement (2026-10-17): picks and counts update immediately in tab memory,
with a Saving state until confirmation. Changes remove the old count and add the
new one. Failures restore/reconcile the authoritative cookie-backed ballot; stale
reads cannot overwrite a newer optimistic change. Score outages retain labelled
last-synced totals and disable reactions/image exports until recovery. No ballot
is saved to localStorage; the signed browser cookie restores it on reload.
The existing live IST countdown, 30-second polling and midnight/visibility refresh
remain. Native character-link sharing falls back to clipboard, legacy copy and
a selectable URL; cancellation never copies. Success haptics remain opt-in and
respect reduced motion. Implementation/release evidence is in the ledger.

To visualise Daily Satire, a labelled sample edition contains seven original
English/Hindi posts across five categories, with articles, related posts and
sharing. It appears on `/satire-arena/daily` while the saved public library is
empty, and can be opened explicitly with `?sample=1`. Samples are noindex and
remain separate from editorial storage, analytics, character captions and ballots.
The existing 13-character Arena remains unchanged. See the functionality ledger
for implementation and deployment status.

## Arena 2 source update (2026-10-16)

Compact labelled cards retain all thirteen characters and changeable daily
ballots. Full illustrations expand in place; portraits and expression sheets
load near the viewport. Character URLs, explicit link/WhatsApp/native sharing,
daily punchlines, a Daily Satire library and genuine 30-day results are added.
Owners publish reviewed posts and maintain character biographies/punchlines at
`/satire-arena/editor`; future schedules and drafts stay out of public pages and
sitemaps. Existing SQL settings provide persistence with optimistic conflict
checks; no schema migration or data reset is needed. Optional aggregate action
measurement defaults off and measures neither unique nor returning people.
Arena advertising stays off. See [operations, API and limits](../../docs/SATIRE_ARENA_2.md).
These additions were deployed and live verified on 2026-10-16; production release
evidence belongs to the functionality ledger. Historical descriptions below retain their original
context and do not override this entry or the current architecture contract.

Current public route: `/satire-arena`. The former `/arena` alias is removed locally; older route references below are historical.

The public page's primary brand is **Garland or Roast**, retaining Satire Arena as the subtitle and the existing `/satire-arena` and `/arena` routes. A prominent Fans/Critics/Amused scoreboard uses authoritative API totals and `resetsAt` for its live midnight-IST countdown, polls every 30 seconds and refreshes at rollover/visibility return. A sticky mini scoreboard, compact six-button cards, selected-pick badges, explicit per-card totals and positive-count/tie-aware leader ribbons improve browsing. The daily Main Event rotates deterministically from the server's round date; it does not alter voting or ranking. Successful votes retain all original feedback and add a short toast; failures show no success toast. No animation, sprite, haptic, ballot ID or API contract is changed.

Arena-wide (1080×1350) and individual-character (1080×1080) PNG share cards render locally with existing portraits, official logo and parody disclaimers. They snapshot public totals only, exclude personal selections/identity and use native file sharing when supported, otherwise download. Cancellation never changes ballots. All existing privacy/disclaimer copy and export/removal controls remain. No new provider, upload, business storage or weekly activity endpoint is added; weekly activity is intentionally absent because the current API has no weekly aggregate. This redesign is locally verified; production publishing is a separate step.

Adapted from the user-owned Contempt Universe Arena without changing its source app, accounts or SQL Server data. Existing Arena vote history is not imported; this platform starts its own rounds.

`frontend/` owns the nine-character cartoon UI, reaction animations, private browser-selected state, pending-link confirmation, scoreboard, support link, export and removal controls. Shared platform headers/themes/footer apply; advertising is off. Artwork provenance is retained in ARTWORK.md.

`backend/routes.js` composes the Arena API on the shared Node connection. In SQL Server mode all ballot generations and the deduplicated scoreboard view belong to `satire` in the ONE platform database; native DDL is under `database/sqlserver`. SQLite compatibility mode registers the same app-owned tables in the existing platform file. `backend/edge.mjs` retains the shared validation, signed browser identity and response contract, with an app-owned database adapter. Cloudflare serves the static page and proxies the Arena API to Node by default. API availability now depends on the origin. Existing deployed D1 data remains untouched until a verified cutover; see [migration instructions](../../docs/SQLSERVER_MIGRATION.md#satire-arena-d1-cutover).

Voting intentionally differs from the original account-based Arena: a signed Secure/HttpOnly/SameSite cookie identifies a browser. Only a keyed hash is stored with each ballot, not a name, phone, account, raw cookie or IP. Public API returns only aggregates plus this browser’s current selections. The cookie is needed to export/remove past choices. Browser clearing/device changes can permit another vote; this is an informal parody game, not one-person voting. No cloud authentication migration is implied.

The SQL primary key `(voter, character, round)` and UPSERT make repeated votes idempotent and changes replace the same ballot. Counters are authoritative SQL counts, not page views, JavaScript increments or eventually-consistent cached totals. Rounds use server time, midnight IST, and retain prior ballot history until that browser removes it. No scheduled reset task is needed. API reads are private/no-store and SQL-mode batches join the shared request transaction; failed batches roll back before a response is sent. Body bounds, exact fields, current-round validation, same-origin writes and a 30/minute IP-based Worker limiter bound submissions, with a bounded process-local socket-IP fallback on Node. These limits do not prevent all bot/cookie-reset abuse.

Production configuration retains `ARENA_STORAGE=d1` until verified migration; SQL cutover changes it explicitly to `sqlserver`. Preview returns unavailable instead of borrowing production votes. Copy the existing `ARENA_COOKIE_SECRET` privately into Node environment settings and preserve it, because rotation makes previous cookies inaccessible. The app-owned importer accepts an administrator-exported D1 SQL dump or Arena-only SQLite snapshot, requires empty target ballot tables and preserves populated other app schemas. Full platform SQL backup includes ballots. There is no automatic retention expiry or operator dashboard yet.

Tests use an isolated in-memory SQLite database and a separate temporary test HTTP process. No existing business records or production votes are used for tests.

Arena expansion (2026-10-10): six characters and six reactions share `frontend/catalogue.mjs`. Garland/Applause count as Fans, Shoe/Throw ink/Tomato as Critics, and Just laughing as Amused. New characters use original code-authored SVG artwork, with no added external assets/services. Additive `002-expanded-arena.sql` preserves the original vote table and introduces expanded ballots plus a latest-ballot view. Atomic batches replace legacy votes on changes and remove both storage generations on deletion. The view deduplicates deployment-overlap ballots by timestamp and prioritizes expanded storage on ties. Apply both schema files to fresh development databases. Existing browser identities, signing secret, rate limits and IST rounds are unchanged.

Portrait refresh (2026-10-10): the newer three characters now use original generated editorial caricatures in `frontend/extra-cast-v2.png`, matching the first trio. Recognizable visual references are Amit Shah, Mamata Banerjee and Nitish Kumar. Existing fictional names, parody labels, character IDs and ballots remain unchanged. The earlier SVG is retained as provenance, not the displayed artwork.

Nine-character expansion: Saffron Sage (Yogi Adityanath visual reference), Cycle Captain (Akhilesh Yadav) and Lexicon Lord (Shashi Tharoor) use original generated `frontend/new-cast.png`. Apply additive `003-nine-character-arena.sql` before the updated Worker: it retains both earlier ballot tables and combines all three generations, deduplicating timestamp ties in favour of newer storage. Writes atomically remove this identity’s older same-day ballot before saving; removal covers all three tables. No signing key, identity or rate-limit change.

Reaction feedback: after a successful vote, each reaction has its own short portrait effect, pressed-button animation and optional brief vibration pattern. The on-page vibration switch is transient. Unsupported/denied hardware vibration never blocks voting. Reduced motion uses one static icon and disables vibration; failed votes show no success effect. No audio, external service or preference write. Browser/hardware vibration limitations: https://www.w3.org/TR/vibration/.
# Ink reaction

Throw ink replaces the former gesture in the public UI. A successful saved vote launches a blue drop and splashes the portrait's face; reduced motion shows a still ink blot. Feedback clears automatically and failed votes do not play it. The existing `finger` ballot key remains the compatibility identifier in API scores, private exports, old links and all database generations, so existing ballots and critic totals are retained without a migration. No new reaction slot, persistence or external asset is introduced.

Eleven-character expansion (2026-10-11): Highway Hari and Budget Beena add road-building and budget parodies in the existing editorial cartoon style. The two-column, five-row highway-budget-expressions.png sheet includes default, happy, startled, angry and laughing faces. Shoe reactions use the scowling/angry row for every character; tomato keeps the startled row. Captions use tighter spacing and restrained tag lettering. Standings PNG expands to 1080�1620 for eleven portraits; single-character PNG remains 1080�1080.

Apply additive 004-highway-budget.sql for SQLite compatibility or immutable SQL Server migration 002-highway-budget.sql before serving the expanded API/frontend. arena_additions_votes stores only the two new character IDs; all earlier tables and ballots remain intact. The aggregate view, private export/removal, schema catalogue and full backup/import cover all four storage generations. Frontend-only deployment is insufficient: the Node API also needs this release and migration.

Thirteen-character expansion (2026-10-11): Rally Raja and Debate Dastan add Tejashwi Yadav/Asaduddin Owaisi parody references in speakers-expressions.png, preserving the existing five-row expression geometry and anger on shoe/ink responses. The Throw ink control and projectile use an original SVG inkpot; the stored finger reaction key retains existing ballots and private exports. Standings PNG is now 1080�1890 to fit thirteen portraits.

Apply additive SQLite 005-speakers.sql or immutable SQL Server 003-speakers.sql before serving this API/frontend. arena_speakers_votes holds only the two new IDs; the latest-ballot view, private deletion, schema catalogue and full backup/import include all five generations. Earlier tables and data remain intact.

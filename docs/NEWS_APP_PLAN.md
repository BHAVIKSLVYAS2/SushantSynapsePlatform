# Sushant Synapse Times — proposed implementation plan

Date: 2026-09-16. Stages 1 and 2 deployed as an owner preview at `/news`, including SQLite storage and the archive reader; verification recorded in the functionality ledger. No news provider, text generation or schedule connected yet.

## Product defaults

- New News app at `/news`, owned by `apps/news`, composed in `server/index.js`.
- Shared login, owner-managed app access and light/dark/system themes.
- Confirmed newspaper name: **Sushant Synapse Times**. Confirmed author byline: **Bhavik**. Retain source credits and clear AI-satire labelling alongside the byline.
- English, India-focused general news with relevant world coverage; these are proposed defaults.
- Initial release: one manually generated newspaper per IST date, containing ten distinct news stories and one clearly labelled original AI satire inspired by a selected story.
- An owner-visible **Fetch today's newspaper** button starts generation only when today's saved edition does not exist. The server checks SQLite first; repeated clicks, reloads and visits return the stored edition without further news or AI calls. Other users with app access can read saved editions.
- Persist an in-progress run before external calls and prevent concurrent clicks from creating duplicate work. Save fetched source material for resumable generation so an AI failure can retry against the same inputs. Publish the complete edition atomically; show actionable failure/retry state without presenting an incomplete newspaper as complete.
- Manual edition news window: preceding 24 hours ending at the first fetch time, recorded with the run. The IST edition date and cutoff remain fixed across retries, including retries crossing midnight. Show edition date, cutoff and actual publication time.
- Daily 05:00 Asia/Kolkata automation is deferred until after the manual release. It will reuse the same stored-edition check and use a 05:00 cutoff; an existing edition for that date must never be overwritten.
- Newspaper masthead, lead story, nine shorter items, source links, satire panel, date picker and previous/next edition navigation. Mobile stacks columns. Include print CSS for browser Print / Save as PDF.
- Archives contain editions actually generated from launch onward; do not fabricate past editions or silently regenerate published ones.

## Proposed external services

The News API is the initial candidate. Its published free plan lists 100 daily requests, three articles per request, real-time top stories and historical data. Pagination and India/English filters are documented. Fetch at least four pages, with a bounded extra budget to remove duplicates and obtain ten distinct stories. Provider ranking plus freshness, source diversity and duplicate removal defines our editorial top ten; this is not an objective ranking of every news outlet.

Before committing the integration, verify the free account's actual endpoint access, India coverage, attribution, storage and derived-content permissions. Free API access alone does not establish permission to republish publisher articles or images. Use brief source-grounded descriptions and links; no full-article scraping or publisher photos in v1. Sparse metadata must yield shorter briefs, never invented facts.

Groq's free API tier is the initial text-generation candidate for short briefs and a 150–250-word satire. A free account and server-side key are required for each service. Select an available model and verify quotas during integration; no paid fallback. Treat fetched news as untrusted input, validate structured output, retain source associations, and keep factual reporting separate from satire. Satire should address the situation or policy without presenting invented allegations or quotations as reporting.

References reviewed on 2026-09-16:
- https://www.thenewsapi.com/pricing
- https://www.thenewsapi.com/documentation
- https://www.thenewsapi.com/tos
- https://console.groq.com/docs/rate-limits

Documentation reviewed; authenticated provider calls and publication/storage terms suitability remain unverified.

## Implementation stages — complete one at a time

1. **App foundation and newspaper UI.** Add app package, protected routes, themed responsive newspaper layout and honest empty/archive states. Use fixtures only in isolated tests. Keep catalogue status Planned until usable and verified.
2. **SQLite editions and archives.** Add tracked migrations under `apps/news/database`, app-owned repositories and `news_`-prefixed edition/story/run tables in the existing database. Register tables for full SQL export. Unique IST edition date, stored masthead/byline, ordered stories, source metadata, satire, cutoff, state and timestamps. Add date/list/detail APIs with app access; owner-only operational writes. Preserve all existing schemas/data. Archived dates open saved editions only; missing past dates show no edition.
3. **News fetch and selection.** Configure server-side credentials; verify live free API access and permitted content retention/use. Validate responses/URLs/dates, paginate within a persisted request budget, deduplicate stories and select ten. Owner can prepare an unpublished preview. Redact keys from logs.
4. **Briefs, satire and manual publication.** Add grounded text generation and output validation. The Fetch button runs the pipeline and publishes a complete validated edition without a separate routine approval step. Save the ten stories plus satire together in a transaction. Record model/prompt version and source associations. A failed draft never replaces a published edition. Reopening or fetching a completed date returns its saved content with zero provider calls.
5. **Verify and release the manual app.** Test additive migrations and SQL restore, access controls, archive dates, deduplication, grounding validation, incomplete/provider-failure cases, quota limits, midnight/timezone boundaries, concurrent clicks and restart recovery. Explicitly verify repeated fetches use SQLite and make no news/AI requests, including after server restart. Use isolated DATA_DIR values. Run Node and relevant browser regressions; inspect mobile/desktop, themes and printing. Verify deployment. Automation is not required for this release.
6. **Later: daily automation.** Reuse the persisted job lease and run state so timer overlap, restart and manual retries cannot duplicate editions. Start at 05:00 IST; bounded retries/backoff on provider failure. On startup after cutoff, attempt today's missing edition using its original news window and mark late publication. Do not auto-backfill older missed dates. Show last success/failure to the owner and retain the latest published edition with its true date if today's run fails. Verify timezone scheduling and the first scheduled run before calling automation operational.

## Operational boundaries

The current deployment runs on a Windows computer through a tunnel. The manual release requires the app and internet when fetching; saved editions require only the running app/database. For later automation, the computer, app process and internet must be available at generation time. An in-process scheduler cannot wake a sleeping/offline host. Startup catch-up mitigates a missed run; guaranteed timely publication requires an always-on host. Host/startup configuration is a separate implementation step, not completed by this plan.

If fewer than ten valid distinct stories or valid satire are available, retain an unpublished failed/pending run and retry within budget; never silently label an incomplete edition complete. Existing editions remain readable. Store archived content in SQLite, not browser state. Keep API credentials in server environment configuration, outside source control and browser responses.

## Next step

Stages 1 and 2 implemented and deployed: owner preview, newspaper foundation, themes, SQLite edition storage, archive APIs and date reader. Next is stage 3: news fetch and selection. Continue sequentially as requested. Language, geographic mix and signed-in access remain proposed defaults. Fetching stays disabled until providers and generation are implemented and verified.

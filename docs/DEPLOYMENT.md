# Deploy Sushant Synapse Platform

Target: **https://apps.sushantsynapse.com**. The repository includes a Node/SQLite app and a Docker Compose/Caddy configuration. These files prepare deployment; pushing to GitHub alone does not put the site on that domain.

## Cloudflare frontend (2026-10-01)

### Current News satire release (2026-10-08)

Implementation commit `ccc3b3c` is deployed to Cloudflare production version `d0ed2d0f-fee6-44a5-9d92-0eed03ee421f`. It retains the previously released Fund Lens and DIGITAL SAMAJ changes. News adds headline-matched comic takes and **Try another take** for saved and temporary editions. Live assets match source; Chrome verified three distinct takes on an existing archive, original restoration, responsive layouts, dark theme and printing, with no page errors or writes.

The active backend is now `C:\Code\SushantSynapsePlatform\.publish\release-ccc3b3c`, with all 216 files verified against the commit. Recovery uses `infrastructure/start-tunnel-host.ps1 -ReleaseRoot C:\Code\SushantSynapsePlatform\.publish\release-ccc3b3c` in a hidden PowerShell process after confirming the existing supervisor is stopped. Observed supervisor PID 12300 and Node PID 6976 may change. The original data directory, port 3001 and dedicated tunnel remain unchanged. This supersedes the backend release path in the historical DIGITAL SAMAJ section below.

Backup `data/backups/pre-news-satire-1791468993344.sqlite` and post-release SQLite integrity are `ok`; all 47 table contents match and foreign-key checks are clean. All 106 Node checks are verified: 99 passed in the full run and seven Cloudflare checks passed on rerun after sandbox build-file permission failures. Nine News browser workflows also passed. No schema migration, new live edition or business record was created during deployment verification.

### Current Fund Lens production release (2026-10-07)

**Current:** Implementation commit `4ef29b1`, Cloudflare production version `5e8ec018-4740-40ae-a7eb-1ec1ad080e17`. The user explicitly authorized committing and deploying the follow-up changes. Live HDFC Top 100/200, SBI Bluechip and historical FMP search checks passed, and served Fund Lens JavaScript matches the commit exactly. Live Chrome HDFC/PPFAS comparison passed at 320/768/1440px with zero backend requests or page errors. This supersedes the initial release and approval-pending history below. All source changes are committed; the following documentation checkpoint records the final verification. No backend restart, database change, DNS change or paid subscription was required.

With explicit user authorization, version `eb1e6012-b39f-4dfc-9a32-20dd2b62e6f9` was deployed to `apps.sushantsynapse.com/*`. Fund Lens comparison and public source requests now operate independently of the Windows origin. Live Chrome verified HDFC/PPFAS comparison, no backend requests or page errors, and layouts at 320/768/1440px. Live holdings checks also passed HDFC Large Cap, SBI Large Cap and ICICI Prudential Value Fund. Two historical schemes correctly returned unavailable-holdings errors. The DIGITAL SAMAJ backend release below remains unchanged, with no restart, data migration, DNS change or paid subscription.

Post-deployment investigation produced additional search/retry improvements. They passed 21 edge/provider tests and six browser workflows. Their rollout initially required separate authorization, subsequently granted by the user; they are now included in the current release above.

### Earlier Fund Lens preparation checkpoint (2026-10-07; superseded above)

Preview version `047d2548-98a0-43c3-b448-f15a64eceb81` serves Fund Lens without the Windows origin. Public reference snapshots are bundled into the Worker; national search and validated holdings use MFapi/Tickertape/Groww directly. The Free plan permits the implementation without subscription changes: each invocation makes at most 36 upstream requests, saves public verification progress and uses HTTP 202 continuation where needed. The per-client/location rate limiter remains 30 requests/minute. Cache retention is best effort, up to 30 days; holdings dates and stale warnings remain explicit. Private legacy APIs still require the Node backend.

Twenty edge/provider tests, six app browser workflows and live preview Chrome verification passed. Run `node infrastructure/cloudflare/verify-funds.cjs https://sushant-synapse-frontend-preview.bhavik-slvyas.workers.dev` to repeat the real HDFC/PPFAS comparison with backend requests blocked. Production deployment was rejected by automatic approval review pending explicit user authorization. **The production Worker still uses the DIGITAL SAMAJ release below.** Once approved, run `npm.cmd run deploy:frontend`, then the same verification script with `https://apps.sushantsynapse.com`, and record the deployed version. No backend restart or data migration is needed.

### Current DIGITAL SAMAJ release (2026-10-07)

The active backend is commit `9c658f5`, exported to `C:\Code\SushantSynapsePlatform\.publish\release-9c658f5`, using the original `data` directory and port 3001. Supervisor PID 17168 and Node PID 4932 were observed at release time; PIDs can change. Restart with `infrastructure/start-tunnel-host.ps1 -ReleaseRoot C:\Code\SushantSynapsePlatform\.publish\release-9c658f5` in a hidden PowerShell process. This supersedes the older backend restart paths below. The existing dedicated tunnel remains unchanged.

Frontend commit `8161247` adds the verified signed-out Hindi language fix and is API-compatible with that backend. Production Worker version `fba2005f-5df9-4057-b887-b38441062b07` serves the existing route. The initial Samaj frontend version was `5429a77e-5808-444b-b04a-12b81b9d81f9`. Both releases were published from clean commit exports. No DNS change was required.

Consistent backup: `data/backups/pre-digital-samaj-1791345025906.sqlite`. Post-migration integrity is `ok`, foreign-key checks are clean and all 21 original tables match the backup by content hash. The 26 additive Samaj tables contain only initial role/permission/migration metadata; no live demo accounts or community records were created. Evidence is retained in `.publish/samaj-release-data-verification.json` and `.publish/samaj-live-verification.json`. Full platform validation passed 99 API tests and 49 browser workflows; final Samaj privacy and language checks passed 12 API and three browser tests.

### Previous frontend checkpoint

**Live and verified:** `sushant-synapse-frontend-production`, version `bcf7db5f-2283-4295-bbc7-3a3fb92e8fa1`, serves `apps.sushantsynapse.com/*`. All 37 public asset files match the source; public pages and backend health/auth-status return 200, private state returns 401 anonymously, and live Chrome passed mobile/desktop theme and sign-in checks. Preview and production browser checks generated ten real stories and three comic panels while backend calls were disabled only in the verification browser. No DNS records or backend processes were changed. This frontend deployment supersedes the older whole-site laptop-availability requirement below; the backend still uses the documented active Node release and tunnel.

The frontend can be deployed independently using `infrastructure/cloudflare/wrangler.jsonc`. It exports only allowlisted public assets. The database, accounts, document blobs, backups and backend remain on the existing Windows server; no data migration is involved.

```powershell
npm.cmd ci
npm.cmd run deploy:frontend:preview
node infrastructure/cloudflare/verify-live.cjs https://sushant-synapse-frontend-preview.bhavik-slvyas.workers.dev
npm.cmd run deploy:frontend
node infrastructure/cloudflare/verify-live.cjs https://apps.sushantsynapse.com
```

Run commands from the repository root. Wrangler requires Cloudflare account access and Workers route permissions for `sushantsynapse.com`. The production Worker route is `apps.sushantsynapse.com/*`; **retain the existing proxied tunnel DNS record**. Do not replace this with a Worker Custom Domain: same-host origin fetches depend on route-based deployment. The main `sushantsynapse.com` website and its separate Worker are unaffected.

The homepage, News, certificates and Timetable Lite load from Cloudflare while the laptop is off. News assembles temporary editions in the browser using its independent Cloudflare source endpoint, with BBC News feeds when Indian Express archives cannot be retrieved; shared archives still require the backend. Other app pages show an accessible, theme-aware unavailable screen with retry and independent-tool links. API failures return uncached HTTP 503 JSON; mid-session failures show a dismissible connection notice without clearing forms or automatically repeating writes. Retry retains the full URL, including tournament share tokens. Backend calls continue to enforce existing sessions, origins and roles. Backend requests and sensitive responses are never cached. The independent News endpoint caches only public source metadata and requires the configured NEWS_LIMITER binding. Read requests time out after 15 seconds and writes after 60 seconds; an interrupted write may have completed on the origin, so users should inspect records before resubmitting. Page health checks time out after four seconds.

Preview Workers deliberately return backend-unavailable responses for origin APIs (the independent News source endpoint remains available), and never send preview credentials or writes to production. The preview is useful for verifying laptop-off behavior without interrupting the real server. Frontend request quotas still apply to Worker-handled page/API requests; this is not a backend hosting migration or an unlimited-uptime guarantee.

Rollback: remove only the production frontend Worker route for `apps.sushantsynapse.com/*` in Cloudflare. The retained DNS record then serves the original tunnel deployment again (requiring the laptop). Do not remove the tunnel, its DNS record, the main-domain Worker or the local data directory. Frontend releases are independent of backend releases; publish matching API-compatible versions.

## Server requirements

- A Linux host with Docker Engine and Docker Compose v2.
- DNS A record for `apps.sushantsynapse.com` pointing to that host. Add an AAAA record only if IPv6 is routed correctly.
- Inbound ports 80 and 443 open. Caddy handles the HTTPS certificate and renewal.
- Persistent disk and an off-device backup plan for the app's SQLite database and documents.

The reverse proxy and certificate configuration follows [Caddy's reverse proxy guide](https://caddyserver.com/docs/quick-starts/reverse-proxy) and [automatic HTTPS requirements](https://caddyserver.com/docs/automatic-https).

## First deployment

```sh
git clone https://github.com/BHAVIKSLVYAS2/SushantSynapsePlatform.git
cd SushantSynapsePlatform
cp .env.example .env
```

Generate a setup secret (`node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"`, or use a password manager), then enter it as `SETUP_TOKEN` in `.env`. Keep this file private and out of Git.

```sh
docker compose --env-file .env -f infrastructure/compose.yaml up -d --build
docker compose --env-file .env -f infrastructure/compose.yaml ps
docker compose --env-file .env -f infrastructure/compose.yaml logs --tail=80 platform caddy
```

Visit the HTTPS domain, enter the setup token and create the first owner account. The setup endpoint locks after an owner exists. There are no default credentials. Invite other people by creating platform accounts under **Team access**, then grant the relevant app access.

- `/` — platform app collection, favourites, recent apps, profile and access management.
- `/advocate` — Chambers advocate app.
- `/batchfee-lite` — private tuition/coaching fee tracker; platform owner access only.
- `/fund-overlap` — public Fund Lens mutual fund overlap analyzer; no login required for reference data or comparisons.
- `/news` — public saved newspaper and date archives; any visitor can generate the shared edition; operational previews require owner access.
- `/healthz` — anonymous health signal; no business data.

The public app port is not published by Compose; only Caddy's ports are exposed. The app runs as a non-root user and requires an HTTPS `PUBLIC_ORIGIN` and setup token when `NODE_ENV=production`. Host and origin checks allow the configured domain. Session cookies are Secure in production.

## Data and updates

The named volume `platform_data` holds `/app/data/chambers.sqlite`, its WAL/SHM files, document blobs and local JSON snapshots. The existing database filename is retained to preserve upgrades. Caddy stores certificate state in its own volumes. Do not use `docker compose --env-file .env -f infrastructure/compose.yaml down -v` on a live installation unless deleting all persisted data is explicitly intended.

Before an update, download a full SQL export from Chambers Settings (includes accounts, app access and platform preferences) and keep a private off-server copy. JSON backups preserve Chambers business data but exclude platform accounts/preferences. After backing up:

```sh
git pull --ff-only
docker compose --env-file .env -f infrastructure/compose.yaml up -d --build
```

For the first transfer of an existing local workspace, stop the source app and securely copy its complete data directory into the platform volume before first use. Do not commit production database files to this repository. Verify the database and account access before directing users to the new host.

## Local Windows tunnel (2026-09-06)

The local deployment uses `infrastructure/start-tunnel-host.ps1` to run production Node on `127.0.0.1:3001` with the existing `data/chambers.sqlite`. An owner already exists; the launcher generates a private setup token on each run. The original development server may continue on port 3000.

`infrastructure/cloudflared.local.yml` routes `apps.sushantsynapse.com` through tunnel `sushant-synapse-platform` (`f22e0bc1-8772-4168-b319-6c358da0f847`). Credentials stay outside the repository under the Windows user's `.cloudflared` directory. The target DNS record is a proxied CNAME named `apps` pointing to `f22e0bc1-8772-4168-b319-6c358da0f847.cfargotunnel.com`.

Tunnel connections, public DNS and HTTPS were verified on 2026-09-06 after the user added the DNS record. `/`, `/advocate`, `/healthz` and `/api/auth/status` return HTTP 200 through the public hostname. The saved Cloudflare certificate only has access to another domain, so DNS was added by the user. Automatic Windows startup is not configured. The computer must remain awake, connected and running both processes to serve this deployment. Logs are in `data/public-server.log` and `data/tunnel.log`.

### Recovery on 2026-09-27

An outage returned Cloudflare error 1033 while no production Node process was listening on port 3001. Restored the existing deployment by starting `infrastructure/start-tunnel-host.ps1` in a hidden PowerShell process and starting a dedicated connector with `infrastructure/cloudflared.local.yml`. The unrelated existing Cloudflared Windows service was left running. The site's connector registered four connections and public `/healthz` returned `ok`. Current connector logs are in `data/tunnel-timetable.log`. Startup after a Windows reboot is still not configured for this application; both the production supervisor and this site's connector must remain running.

## BatchFee release, 2026-09-28

The existing Windows supervisor restarted the production Node process to load BatchFee Lite. Public HTTPS health, homepage, app HTML/JavaScript/CSS and existing app pages were verified; asset bytes matched the release checkout. Anonymous BatchFee data and backup requests return 401. Live Chrome verified the sign-in boundary, homepage launch link and 320–1440px layouts without creating business records.

Consistent pre-release backup: `data/backups/pre-batchfee-1790528480616.sqlite` (integrity `ok`). Post-release integrity is `ok`; original records, accounts, files and settings are unchanged. Concurrent sign-ins, preference activity and an added hearing after the backup remain preserved. The additive BatchFee schema has one migration marker and empty workspace/history tables, leaving academy setup to the owner. Existing tunnel and supervisor remain in use; reboot startup remains unconfigured.

## Operational boundaries

### Complete toggle and certificate release, 2026-10-01 (current release)

Application commit `87ea335` is live from `C:\Code\SushantSynapsePlatform\.publish\release-theme-toggle`, superseding `release-access-correction`. This includes all pending source changes: the shared light/dark toggle, Corporate certificate design and documentation. All 176 exported files match the commit. All 79 Node/API tests and 41 browser workflows passed. Live HTTPS matched 18 assets; Chrome verified both toggle states, Corporate design selection, mobile/desktop layouts and sign-in boundaries with no business writes.

For recovery, first confirm the application is stopped, then launch the supervisor using the active release path:

```powershell
Start-Process -FilePath powershell.exe -WindowStyle Hidden -ArgumentList @('-NoProfile','-ExecutionPolicy','Bypass','-File','C:\Code\SushantSynapsePlatform\infrastructure\start-tunnel-host.ps1','-ReleaseRoot','C:\Code\SushantSynapsePlatform\.publish\release-theme-toggle')
```

Supervisor PID 4124 and Node PID 9680 serve port 3001; the existing dedicated tunnel remained connected. The original data directory is retained. Backup `data/backups/pre-theme-release-1790819295075.sqlite` and post-release SQLite integrity are `ok`; all 21 tables are unchanged. Do not remove the active release directory. The host and tunnel must remain running; automatic reboot startup remains unconfigured.

### Homepage access correction, 2026-10-01 (current release)

Commit `d90a031` is served from `C:\Code\SushantSynapsePlatform\.publish\release-access-correction`. It separates Tournament Lite organizing from the four no-login tools and includes the certificate header alignment fix. This supersedes `release-f4ece30` as the active application directory. Keep the release directory and original `data` directory intact. For recovery, confirm the application is stopped, then launch:

```powershell
Start-Process -FilePath powershell.exe -WindowStyle Hidden -ArgumentList @('-NoProfile','-ExecutionPolicy','Bypass','-File','C:\Code\SushantSynapsePlatform\infrastructure\start-tunnel-host.ps1','-ReleaseRoot','C:\Code\SushantSynapsePlatform\.publish\release-access-correction')
```

The dedicated tunnel must also remain running. Supervisor PID 13144 and Node PID 1732 serve port 3001. Exact release checks passed 79 Node/API tests and 11 browser workflows. Live HTTPS assets, public/private app separation with/without JavaScript, certificate header alignment, sign-in links, responsive layouts and API access boundaries passed. Backup `data/backups/pre-access-release-1790796161711.sqlite` and post-release integrity are `ok`; all 21 tables are unchanged. No live test records were created. Automatic Windows reboot startup remains unconfigured.

### Tournament and shared header release, 2026-10-01

Application commit `f4ece30` is deployed from the clean export `C:\Code\SushantSynapsePlatform\.publish\release-f4ece30`, not the editable working tree. All 175 release files match the commit. Launcher commit `84a741b` adds `-ReleaseRoot` while keeping `DATA_DIR` anchored to `C:\Code\SushantSynapsePlatform\data`. Do not delete the active release directory. Future deployment must explicitly select a verified release; omitting the option retains the legacy working-tree behavior.

To recover the application after a reboot, first confirm no application supervisor/server is already running, then start this hidden supervisor:

```powershell
Start-Process -FilePath powershell.exe -WindowStyle Hidden -ArgumentList @('-NoProfile','-ExecutionPolicy','Bypass','-File','C:\Code\SushantSynapsePlatform\infrastructure\start-tunnel-host.ps1','-ReleaseRoot','C:\Code\SushantSynapsePlatform\.publish\release-f4ece30')
```

The dedicated Cloudflare connector must also be running as documented above. At deployment, supervisor PID 9756 and Node PID 15600 replaced only the prior verified application processes; the tunnel stayed connected. The release passed 79 Node/API tests and 10 portal/tournament/header Chrome workflows before deployment. Live HTTPS matched 17 assets, protected private APIs, and passed responsive/theme/sign-in checks without business writes. Backup `data/backups/pre-header-release-1790795627440.sqlite` and post-release SQLite integrity are `ok`; all 21 tables are unchanged. Unrelated local edits remain preserved outside the release. Automatic reboot startup remains unconfigured.

### News illustrated UI release, 2026-10-01

Commit `86ad39f` adds locally served original WebP illustrations, a comic newspaper cover, topic filters and illustrated satire panels. The isolated release passed 74 Node/API tests and six News Chrome workflows. Restarted only the verified production Node child under the existing supervisor; the dedicated tunnel remained running. Live HTTPS checks confirmed exact News assets and both images, WebP MIME, healthy endpoints, protected APIs and browser rendering of an existing edition with no page errors.

Backup `data/backups/pre-news-ui-1790793692001.sqlite` and post-release SQLite both pass integrity checks; all 21 tables are unchanged. No live test editions or business records were created. Existing host uptime requirements remain.

### News release, 2026-09-29

Application commit `31b8a6c` deploys historical edition generation, future-date rejection, varied archive stories including entertainment and fictional three-panel satire. The isolated staged release passed 74 Node/API tests and six News Chrome workflows. Restarted only the verified production Node child under the existing supervisor; the tunnel stayed connected. Public health, exact News asset bytes, provider status, future-date rejection, protected API boundaries and mobile/desktop browser checks passed. No live test edition or business record was created.

Backup `data/backups/pre-news-1790705796418.sqlite` and post-release SQLite integrity are `ok`; all 21 tables match exactly. Unrelated working-tree changes were excluded from the News commit and preserved in place. Existing Windows host/tunnel uptime requirements remain.

### Tournament Lite scoring fix, 2026-09-29

Deployed the validated partial-score saving and progression fixes after 76 Node/API tests and six Tournament Lite Chrome workflows passed. The production app and dedicated tunnel had stopped; restored the existing hidden launcher and site connector. Public HTTPS health, matching release assets, anonymous access protection and live mobile/desktop sign-in checks passed. No live test tournaments or scores were created. Backup `data/backups/pre-tournament-1790704480553.sqlite` and the post-release database both pass integrity checks; all 21 table contents are unchanged. Connector log: `data/tunnel-tournament-fix.log`. Existing host uptime and reboot-startup limitations remain.

### Tournament Lite release, 2026-09-28

Application commit `b578d4f` is live at `/tournament-lite`. The isolated staged release passed 72 Node/API tests and five app/portal browser workflows. The existing supervisor restarted only its verified production Node child. Public HTTPS assets match the local release, organizer routes reject anonymous reads/writes, and live Chrome passed the sign-in boundary and 320–1440px layout checks. Existing app pages remain available.

Backup: `data/backups/pre-tournament-1790606018920.sqlite`. Before/after integrity is `ok`; all 19 existing tables are unchanged. Two app-owned tables were added with zero tournaments and one migration marker. No live demo records were created. Existing Windows/tunnel operational requirements still apply.

This is one private platform workspace with shared staff identities, not multi-tenant SaaS. App access is enforced by the server; Chambers roles are Owner/Advocate/Clerk. Future apps are explicitly marked Planned and have no launch route. Add future apps through `packages/app-registry/index.js`, dedicated storage/handlers, permission enforcement, tests and ledger updates.

Backups are not encrypted by the application, local snapshots have no automatic retention deletion, and no email/SMS/court-data providers are configured. User accounts are owner-provisioned; no public registration or email password reset exists. Login attempt limits are per account and connection source; add appropriate edge rate limiting for a public installation. Choose monitoring, external backups and host patching procedures before real client data is used.

Docker and DNS deployment must be verified on the target host. This development environment's browser/API verification does not constitute a live deployment check.
# Fund Lens search recovery release, 2026-10-08

Production Worker version `f9030162-6f94-4ecb-aaee-7351d4540f25` contains the authorized search resource-use fix, Mirae `and`/`&` matching and HTML-response error handling. All ten real searches passed on preview version `60f7e111-b2d3-45db-be77-94ebaeade6bc`. Post-release production verification is pending because this machine's connections to the production hostname timed out before HTTP responses; preview remained reachable. The existing route, backend, SQLite database and subscription were unchanged. Run `node .publish/verify-fund-search-fix.cjs` to repeat ten production Chrome searches and asset/layout checks. See the latest functionality-ledger checkpoint for evidence and limitations.

### Daily Spark production release (2026-10-09)

Daily Spark is live at https://apps.sushantsynapse.com/daily-spark on Cloudflare Worker version c2d5110f-d5a4-4cd5-85d2-1d9947322849, from implementation commit 02be2c9. Both page routes are independent of the origin. Eight live asset/page comparisons and live Chrome solve/share/theme/responsive/backend-blocked checks passed; the no-JavaScript homepage includes the fifth card. Evidence: .publish/daily-spark-live-verification.json. No SQLite migration or backend restart was performed. The Node account catalogue remains on its previous release; public homepage discovery and puzzle access are live. Internet access and existing Worker quotas apply.

### Decision Wheel production release (2026-10-09)

Decision Wheel is live at https://apps.sushantsynapse.com/decision-wheel from implementation commit 63a0fa2 on Cloudflare Worker version f639daf4-341e-41f5-97cb-15088aa1bd82. Eight live page/asset comparisons and Chrome spin/share/removal/reduced-motion/theme/responsive/backend-blocked checks passed. The no-JavaScript homepage has six public app cards and a working wheel link. Evidence: .publish/decision-wheel-live-verification.json. Both page routes bypass origin health checks. No app database migration or backend restart was performed. The shared Node account catalogue remains on its prior backend release; homepage and public sign-in/outage links are live independently. Internet access and existing Worker quotas apply.

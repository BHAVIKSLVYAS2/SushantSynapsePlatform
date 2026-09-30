# Deploy Sushant Synapse Platform

Target: **https://apps.sushantsynapse.com**. The repository includes a Node/SQLite app and a Docker Compose/Caddy configuration. These files prepare deployment; pushing to GitHub alone does not put the site on that domain.

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

### News illustrated UI release, 2026-10-01

Commit `86ad39f` adds locally served original WebP illustrations, a comic newspaper cover, topic filters and illustrated satire panels. The isolated release passed 74 Node/API tests and six News Chrome workflows. Restarted only the verified production Node child under the existing supervisor; the dedicated tunnel remained running. Live HTTPS checks confirmed exact News assets and both images, WebP MIME, healthy endpoints, protected APIs and browser rendering of an existing edition with no page errors.

Backup `data/backups/pre-news-ui-1790793692001.sqlite` and post-release SQLite both pass integrity checks; all 21 tables are unchanged. No live test editions or business records were created. Existing host uptime requirements remain.

### News release, 2026-09-29

Application commit `31b8a6c` deploys historical edition generation, future-date rejection, varied archive stories including entertainment and fictional three-panel satire. The isolated staged release passed 74 Node/API tests and six News Chrome workflows. Restarted only the verified production Node child under the existing supervisor; the tunnel stayed connected. Public health, exact News asset bytes, provider status, future-date rejection, protected API boundaries and mobile/desktop browser checks passed. No live test edition or business record was created.

Backup `data/backups/pre-news-1790705796418.sqlite` and post-release SQLite integrity are `ok`; all 21 tables match exactly. Unrelated working-tree changes were excluded from the News commit and preserved in place. Existing Windows host/tunnel uptime requirements remain.

### Tournament Lite release, 2026-09-28

Application commit `b578d4f` is live at `/tournament-lite`. The isolated staged release passed 72 Node/API tests and five app/portal browser workflows. The existing supervisor restarted only its verified production Node child. Public HTTPS assets match the local release, organizer routes reject anonymous reads/writes, and live Chrome passed the sign-in boundary and 320–1440px layout checks. Existing app pages remain available.

Backup: `data/backups/pre-tournament-1790606018920.sqlite`. Before/after integrity is `ok`; all 19 existing tables are unchanged. Two app-owned tables were added with zero tournaments and one migration marker. No live demo records were created. Existing Windows/tunnel operational requirements still apply.

This is one private platform workspace with shared staff identities, not multi-tenant SaaS. App access is enforced by the server; Chambers roles are Owner/Advocate/Clerk. Future apps are explicitly marked Planned and have no launch route. Add future apps through `packages/app-registry/index.js`, dedicated storage/handlers, permission enforcement, tests and ledger updates.

Backups are not encrypted by the application, local snapshots have no automatic retention deletion, and no email/SMS/court-data providers are configured. User accounts are owner-provisioned; no public registration or email password reset exists. Login attempt limits are per account and connection source; add appropriate edge rate limiting for a public installation. Choose monitoring, external backups and host patching procedures before real client data is used.

Docker and DNS deployment must be verified on the target host. This development environment's browser/API verification does not constitute a live deployment check.

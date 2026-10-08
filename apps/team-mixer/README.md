# Team Mixer

A free public tool at `/team-mixer`: enter 2–100 unique names (up to 60 Unicode characters each), choose 2–20 teams, optionally name the activity, and mix. At least one person per team is required. Fictional sample names are shown initially and can be restored explicitly.

Rejection-sampled browser cryptographic randomness drives Fisher–Yates shuffles of participant names and team allocation order. Each participant appears exactly once; team sizes differ by at most one. Shuffling allocation order randomizes which team labels get an extra member. The app balances headcounts, not skill, experience, gender or other attributes. No remote randomness service or API is used.

Teams appear with an animated staggered reveal. Reduced-motion users receive the result immediately. Inputs and result actions are locked during mixing/export; editing the setup clears old results, preventing stale team sharing. Mixing again makes a new random assignment and may produce the same assignment by chance.

Download a PNG team card at 1200px wide with dynamic height, wrapped full names and all teams. Unicode text uses device system fonts. Copy team list includes the title and all participant names. Explicit native file sharing sends the team image; unsupported/rejected sharing falls back to PNG download. Cancellation retains the teams. No automatic message delivery or shared live room is implemented. The public app link contains no names or saved assignment.

All names and team results stay in transient tab memory; refresh restores the sample and clears custom results. Only shared theme preferences persist. No accounts, database tables, browser business-state storage, uploaded names, tracking, paid provider or runtime dependency is introduced. Both public page routes bypass Cloudflare origin health checks. Internet is needed to open the hosted app; mixing/export work without backend requests once loaded. No offline service worker is installed.

Verification: `node --test tests/team-mixer.test.js`; `npx.cmd playwright test apps/team-mixer/tests`. Browser tests use isolated temporary DATA_DIRs. Deployment status and evidence are recorded in docs/FUNCTIONALITY_LEDGER.md.
